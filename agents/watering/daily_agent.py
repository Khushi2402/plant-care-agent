import os
import json
import requests
from datetime import datetime, timedelta, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
APP_SECRET = os.environ["APP_SECRET"]
OPENROUTER_API_KEY = os.environ["OPENROUTER_API_KEY"]

PLANT_ID = "plant_1"
MAX_TOOL_ITERATIONS = 5  # hard safety cap — agent can never loop indefinitely

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "x-app-secret": APP_SECRET,
    "Content-Type": "application/json",
}


def get_plant():
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/plants",
        headers=HEADERS,
        params={"plant_id": f"eq.{PLANT_ID}", "select": "*"},
    )
    res.raise_for_status()
    rows = res.json()
    if not rows:
        raise ValueError("No plant found — has onboarding been completed?")
    return rows[0]


def get_moisture_trend(plant_id: str) -> str:
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/readings",
        headers=HEADERS,
        params={
            "plant_id": f"eq.{plant_id}",
            "created_at": f"gte.{since}",
            "select": "created_at,moisture_pct",
            "order": "created_at.asc",
        },
    )
    res.raise_for_status()
    readings = res.json()

    if not readings:
        return "No moisture readings in the last 24 hours."

    values = [r["moisture_pct"] for r in readings if r["moisture_pct"] is not None]
    if not values:
        return "Readings exist but moisture_pct is missing."

    return (
        f"Last 24h: {len(values)} readings. "
        f"Started at {values[0]}%, currently at {values[-1]}%. "
        f"Min {min(values)}%, max {max(values)}%."
    )


def get_weather_forecast(lat: float, lon: float) -> str:
    res = requests.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "daily": "precipitation_probability_max,temperature_2m_max",
            "forecast_days": 2,
            "timezone": "auto",
        },
    )
    res.raise_for_status()
    data = res.json()["daily"]

    return (
        f"Today: max temp {data['temperature_2m_max'][0]}°C, "
        f"{data['precipitation_probability_max'][0]}% chance of rain. "
        f"Tomorrow: max temp {data['temperature_2m_max'][1]}°C, "
        f"{data['precipitation_probability_max'][1]}% chance of rain."
    )


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_moisture_trend",
            "description": "Get the plant's soil moisture trend over the last 24 hours.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather_forecast",
            "description": "Get today and tomorrow's weather forecast for the plant's location.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]


def run_agent(plant: dict) -> dict:
    system_prompt = f"""You are a plant care agent deciding whether to water "{plant['name']}" ({plant.get('species', 'unknown species')}).

Care notes: {plant.get('watering_notes', 'none available')}
Ideal moisture range: {plant.get('ideal_moisture_min')}%–{plant.get('ideal_moisture_max')}%

Use the available tools to check the current moisture trend and the weather forecast, then decide.

Once you have both pieces of information, respond with ONLY a JSON object (no markdown, no tool calls), in this exact shape:
{{
  "decision": "water" | "hold" | "skip",
  "reasoning": "2-3 sentence explanation of the decision",
  "moisture_trend_summary": "short summary of the moisture data",
  "weather_summary": "short summary of the weather data"
}}

- "water": moisture is below the ideal range and no significant rain is expected soon.
- "hold": moisture is borderline or rain is expected soon, so wait.
- "skip": moisture is already within or above the ideal range."""

    messages = [{"role": "system", "content": system_prompt}]

    for _ in range(MAX_TOOL_ITERATIONS):
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "google/gemini-2.5-flash-lite",
                "max_tokens": 600,
                "messages": messages,
                "tools": TOOLS,
            },
        )
        res.raise_for_status()
        message = res.json()["choices"][0]["message"]
        messages.append(message)

        tool_calls = message.get("tool_calls")
        if not tool_calls:
            # Final answer — no more tool calls, parse it
            content = message["content"].replace("```json", "").replace("```", "").strip()
            return json.loads(content)

        for call in tool_calls:
            fn_name = call["function"]["name"]
            if fn_name == "get_moisture_trend":
                result = get_moisture_trend(plant["plant_id"])
            elif fn_name == "get_weather_forecast":
                result = get_weather_forecast(plant["latitude"], plant["longitude"])
            else:
                result = f"Unknown tool: {fn_name}"

            messages.append({
                "role": "tool",
                "tool_call_id": call["id"],
                "content": result,
            })

    raise RuntimeError(f"Agent exceeded {MAX_TOOL_ITERATIONS} tool iterations without a final decision.")


def log_decision(plant_id: str, result: dict):
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/decisions",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json={
            "plant_id": plant_id,
            "decision": result["decision"],
            "reasoning": result["reasoning"],
            "moisture_trend_summary": result.get("moisture_trend_summary"),
            "weather_summary": result.get("weather_summary"),
        },
    )
    res.raise_for_status()


def send_push_notifications(plant_name: str, result: dict):
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/device_tokens",
        headers=HEADERS,
        params={"select": "expo_push_token"},
    )
    res.raise_for_status()
    tokens = [row["expo_push_token"] for row in res.json()]

    if not tokens:
        print("No registered device tokens — skipping push (app hasn't registered one yet).")
        return

    messages = [
        {
            "to": token,
            "title": f"{plant_name}: {result['decision'].upper()}",
            "body": result["reasoning"][:150],
        }
        for token in tokens
    ]

    push_res = requests.post(
        "https://exp.host/--/api/v2/push/send",
        headers={"Content-Type": "application/json"},
        json=messages,
    )
    push_res.raise_for_status()
    print(f"Sent push to {len(tokens)} device(s).")


def main():
    plant = get_plant()
    print(f"Running daily agent for: {plant['name']}")

    result = run_agent(plant)
    print(f"Decision: {result['decision']}")
    print(f"Reasoning: {result['reasoning']}")

    log_decision(plant["plant_id"], result)
    send_push_notifications(plant["name"], result)

    print("Done.")


if __name__ == "__main__":
    main()