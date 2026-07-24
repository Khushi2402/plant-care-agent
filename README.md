# 🌱 Plant Care Agent

Part of the **Khushi Builds** portfolio series — a set of hardware + AI agent projects exploring genuine multi-step tool-calling and real-world sensor integration, built independently of my day job's GIS domain.

## What it does

An AI agent that decides whether a houseplant needs watering — using real soil sensor data _and_ live weather forecasts, not just a single threshold check.

- An **ESP32 + capacitive soil moisture sensor** continuously logs moisture readings to Supabase every 3 hours.
- **Once a day (5am IST)**, a watering agent runs a real reasoning pass with tool-calling:
  - Calls a tool to pull the moisture trend from Supabase
  - Calls a tool to check the weather forecast via Open-Meteo, using the plant's saved location
  - Decides: **water now** / **hold off** (rain incoming) / **skip** (still moist)
- The decision and full reasoning are logged to Supabase, and a push notification is sent to the companion mobile app.
- A separate **onboarding agent** lets a user add a plant by name + city — it proposes a care profile (species, watering notes, ideal moisture range, factoring in local climate), asks a clarifying question if the name is ambiguous, and the user reviews/edits before it's saved.

This project is designed to demonstrate **real multi-step tool use and batch reasoning**, not a single API call wrapped in a UI.

## Architecture

**Onboarding flow** (adding a new plant, human-in-the-loop):

1. Enter plant name + city (mobile app)
2. City is geocoded to lat/lon (Open-Meteo geocoding API)
3. Onboarding Agent (Supabase Edge Function + LLM via OpenRouter) proposes species, watering notes, ideal moisture range — factoring in local climate
4. If ambiguous → agent asks a clarifying question
5. Review & edit in app
6. Saved to `plants` table, including resolved location

**Daily watering flow** (autonomous, scheduled):

1. ESP32 + Soil Sensor logs readings to Supabase every 3 hours
2. GitHub Actions (daily cron, 5am IST) wakes the Watering Agent (Python)
3. Agent calls two tools:
   - `get_moisture_trend` → queries Supabase `readings` for the last 24h
   - `get_weather_forecast` → queries Open-Meteo using the plant's saved coordinates
4. LLM (via OpenRouter) reasons over both and decides: water / hold / skip
5. Result is logged to `decisions` table **and** sent as a push notification (Expo)

## Tech Stack

- **Hardware:** ESP32, capacitive soil moisture sensor
- **Firmware:** Arduino IDE / C++
- **Backend/DB:** Supabase (Postgres), Supabase Edge Functions
- **Mobile app:** Expo / React Native — onboarding form (name + location), dashboard (moisture gauge, 7-day chart, decision log), push notifications
- **AI:** Accessed via [OpenRouter](https://openrouter.ai) rather than a direct provider API — chosen due to Indian-issued card payment failures against USD-billed direct APIs (a documented, common India-specific billing friction). Currently using **Google Gemini 2.5 Flash Lite** for both agents — a deliberate cost/reliability trade-off, since this task (structured plant-care reasoning) doesn't require frontier-level precision. Both agents use real tool-calling, not single-shot prompts.
- **Weather:** Open-Meteo (free, no auth) — also used for geocoding plant locations
- **Scheduling:** GitHub Actions (cron)
- **Notifications:** Expo Push
- **Language:** Python (watering agent), TypeScript (Edge Function + app), C++ (firmware)

## Design Decisions

- **Continuous sensing, daily reasoning:** the ESP32 logs cheaply every 3 hours; the watering agent runs once a day to reason over the full trend rather than reacting to a single noisy reading. Cheaper, and produces better-reasoned decisions.
- **Real tool-calling, not a single prompt:** the daily agent explicitly calls out to Supabase and Open-Meteo as tools mid-reasoning, rather than having all data pre-stuffed into one prompt — mirrors how production agentic systems are built.
- **Two agents, split by cadence and purpose:** onboarding (static domain knowledge + location context, human-reviewed, one-time per plant) is kept separate from daily watering (live data, autonomous, tool-calling).
- **Human-in-the-loop onboarding:** AI-proposed plant profiles are reviewed/edited before saving, not auto-committed — moisture tolerances are load-bearing for every future decision.
- **Per-plant location, not hardcoded:** location is captured and geocoded once at onboarding time and stored on the plant itself, so the weather tool and climate-aware watering notes generalize to any plant/location rather than assuming one fixed city.
- **Model choice — OpenRouter + Gemini Flash Lite over direct provider billing:** switched after hitting a structural India/USD billing incompatibility with direct provider billing (RBI e-mandate rules don't support non-INR recurring authorization on Indian-issued cards). Gemini 2.5 Flash Lite was chosen over cheaper alternatives (e.g. DeepSeek) specifically for its more reliable tool-calling behavior, since a failed tool call would break a scheduled run.
- **Hard iteration cap on the daily agent:** the tool-calling loop is capped at a fixed number of rounds as a safety measure against runaway agentic spend — a deliberate constraint, not an oversight.
- **No login, secret-header RLS:** since this app has a single user, Supabase access is secured via a fixed app secret checked in RLS policies rather than full auth — documented simplification, would need real auth if this became multi-user.
- **Power source (v1):** USB power bank, chosen for reliability and simplicity while establishing the core software pipeline. Solar power is a flagged v2 stretch goal.
- **Push notifications — implemented, testing pending a dev build:** registration and sending logic are fully built, but Expo Go (SDK 53+) no longer supports remote push testing; verifying real delivery requires an EAS development build rather than Expo Go.
- **Out of scope (documented, not a gap):** self-adjusting moisture ranges (flagged v3, needs a plant-health signal that doesn't exist yet); pH monitoring (schema ready, sensor added in v2).

## Status

✅ Hardware wired, calibrated, and logging to Supabase on schedule
✅ Database schema complete, RLS enabled with secret-header policies
✅ Onboarding agent live — real AI-generated plant profiles, tested end-to-end
✅ Daily watering agent live — running autonomously every morning via GitHub Actions, real tool-calling confirmed in production logs
✅ Mobile app — onboarding, dashboard with real moisture chart and decision history, all wired to live data
🚧 Push notification delivery — built, pending verification via EAS development build

## Project Series

Part of **Khushi Builds** — a portfolio series of hardware + AI agent projects. See also: NightGuard, Desk Buddy.
