# 🌱 Plant Care Agent

Part of the **Khushi Builds** portfolio series — a set of hardware + AI agent projects exploring genuine multi-step tool-calling and real-world sensor integration, built independently of my day job's GIS domain.

## What it does

An AI agent that decides whether a houseplant needs watering — using real soil sensor data *and* live weather forecasts, not just a single threshold check.

- An **ESP32 + capacitive soil moisture sensor** continuously logs moisture readings to Supabase.
- **Once a day**, a watering agent (Claude Haiku via the Anthropic API) runs a reasoning pass:
  - Calls a tool to pull the moisture trend from Supabase
  - Calls a tool to check the weather forecast via Open-Meteo
  - Decides: **water now** / **hold off** (rain incoming) / **skip** (still moist)
- The decision and reasoning are logged to Supabase, and a **push notification** is sent to a companion mobile app.
- A separate **onboarding agent** lets you add a new plant by name — it proposes a care profile (species, ideal moisture range), asks a clarifying question if the name is ambiguous, and you review/edit before it's saved.

This project is designed to demonstrate **real multi-step tool use and batch reasoning**, not a single API call wrapped in a UI — a pattern carried forward and leveled up from earlier prototypes in this series (NightGuard, Desk Buddy).

## Architecture

**Onboarding flow** (adding a new plant, human-in-the-loop):
```
Enter plant name (mobile app)
        │
        ▼
Onboarding Agent (Supabase Edge Function + Claude)
   proposes species, watering notes, ideal moisture range
        │
        ▼
If ambiguous → agent asks a clarifying question
        │
        ▼
Review & edit in app
        │
        ▼
Saved to `plants` table
```

**Daily watering flow** (autonomous, scheduled):
```
ESP32 + Soil Sensor ──(every 5-15 min)──> Supabase (readings table)
                                                │
                                                ▼
GitHub Actions (daily cron) ──> Watering Agent (Python)
                                     │
                        ┌────────────┴────────────┐
                        ▼                          ▼
              Tool: get_moisture_trend    Tool: get_weather_forecast
                   (Supabase query)          (Open-Meteo API)
                        │                          │
                        └────────────┬─────────────┘
                                     ▼
                        Claude Haiku (decision + reasoning)
                                     │
                        ┌────────────┴────────────┐
                        ▼                          ▼
              Supabase (decisions table)    Push notification (Expo)
```

## Tech Stack

- **Hardware:** ESP32, capacitive soil moisture sensor
- **Firmware:** Arduino IDE / C++
- **Backend/DB:** Supabase (Postgres), Supabase Edge Functions
- **Mobile app:** Expo / React Native — onboarding form, dashboard (moisture history + decision log), push notifications
- **AI:** Anthropic API — Claude Haiku, real tool-calling (two agents: onboarding + daily watering)
- **Weather:** Open-Meteo (free, no auth)
- **Scheduling:** GitHub Actions (cron)
- **Notifications:** Expo Push
- **Language:** Python (watering agent), TypeScript (Edge Function + app), C++ (firmware)

## Design Decisions

- **Continuous sensing, daily reasoning:** the ESP32 logs cheaply and often; the watering agent runs once a day to reason over the full day's trend rather than reacting to a single noisy reading. Cheaper, and produces better-reasoned decisions.
- **Real tool-calling, not a single prompt:** the daily agent explicitly calls out to Supabase and Open-Meteo as tools mid-reasoning, rather than having all data pre-stuffed into one prompt — mirrors how production agentic systems are built.
- **Two agents, split by cadence and purpose:** onboarding (static domain knowledge, human-reviewed, one-time per plant) is kept separate from daily watering (live data, autonomous, tool-calling). Keeps each agent's reasoning focused and avoids re-deriving static facts every day.
- **Human-in-the-loop onboarding:** AI-proposed plant profiles are reviewed/edited before saving, not auto-committed — moisture tolerances are load-bearing for every future decision, so a wrong guess shouldn't silently enter the system.
- **No login, secret-header RLS:** since this app has a single user, Supabase access is secured via a fixed app secret checked in RLS policies rather than full auth — documented simplification, would need real auth if this became multi-user.
- **Power source (v1):** USB power bank, chosen for reliability and simplicity while establishing the core software pipeline. Solar power is a flagged v2 stretch goal.
- **Out of scope (documented, not a gap):** self-adjusting moisture ranges (flagged v3, needs a plant-health signal that doesn't exist yet); pH monitoring (schema ready, sensor added in v2).

## Status

🚧 In progress — database schema complete, hardware wiring and calibration underway.

## Project Series

Part of **Khushi Builds** — a portfolio series of hardware + AI agent projects.
