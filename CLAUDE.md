# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

btcgram is a Java/Spring Boot API that takes coordinates (`lat`/`lon`) and returns reverse-geocoded location, weather, local time, and current BTC price in one response. It's the **backend** for a planned app where a user takes a photo and the app overlays this location/weather/time/price data onto it as a shareable "moment" snapshot.

Only the backend exists so far, at `backend/btcgram/` (Maven multi-directory layout — there is no root-level build file, everything Java lives under that subdirectory). A React Native (Expo) mobile frontend is planned but not yet started — see "Planned frontend" below for decisions already made about it.

## Commands

All commands run from `backend/btcgram/`.

- Run the app locally: `./mvnw spring-boot:run` (Windows: `mvnw.cmd spring-boot:run`) — starts on `http://localhost:8080`
- Run tests: `./mvnw test`
- Run a single test: `./mvnw test -Dtest=ClassName#methodName`
- Build a jar: `./mvnw clean package`
- Build/run via Docker (from `backend/btcgram/`):
  ```bash
  docker build -t btcgram .
  docker run -p 8080:8080 btcgram
  ```
  Useful for reaching the API from another device on the LAN (e.g. a phone running the frontend) at `http://<host-LAN-IP>:8080`.

Requires Java 25 (Temurin) — no local Maven install needed, the wrapper (`mvnw`) is checked in.

## Architecture

**Single endpoint, three services fanned out and zipped together.** `MomentController` (`controller/MomentController.java`) handles `GET /api/moment?lat=&lon=`: it calls `GeocodingService`, `WeatherService`, and `CryptoService` independently, each returning a `Mono`, and combines them with `Mono.zip(...)` into one `Moment` response. The three calls are concurrent, not sequential — none of the services depend on each other's output.

There's also `GET /api/debug/raw` (also in `MomentController`), which returns Nominatim's raw JSON response unprocessed — a debugging aid, not part of the real API contract, not meant for frontend use.

**Each service owns one upstream API, via a scoped `WebClient`.** `WebClientConfig` provides a shared `WebClient.Builder` bean; each service (`GeocodingService`, `WeatherService`, `CryptoService`) builds its own `WebClient` off that builder with its own `baseUrl`:
- `GeocodingService` → Nominatim (`nominatim.openstreetmap.org/reverse`) for city/country. Picks the best city name via a fallback chain (`city > town > village > hamlet > county`).
- `WeatherService` → Open-Meteo (`api.open-meteo.com/v1/forecast`) for temperature (Fahrenheit), a plain-English condition mapped from Open-Meteo's numeric WMO weather codes, IANA timezone, and local time — all from one response.
- `CryptoService` → CoinGecko (`api.coingecko.com`) for BTC/USD price, with an in-memory 60s cache (`volatile` fields, no external cache library) to avoid hammering the free API on every request.

None of the three upstream APIs require an API key.

**Error handling is asymmetric and known to be inconsistent** (see README's "Known issues" section) — worth checking current behavior against the code rather than assuming, since this is actively being worked on:
- `GeocodingService.reverseGeocode` has `.onErrorReturn(...)` → returns sentinel strings (`"Unknown"` when no address found, `"Unavailable"` on request failure) rather than throwing.
- `CryptoService.getBtcPriceUsd` has `.onErrorReturn(0.0)` → falls back to zero on failure, which is ambiguous with "price is actually zero" (README notes this may change to `null` later).
- `WeatherService.getCurrentWeather` has **no** `onErrorReturn` — a weather-provider failure propagates and fails the entire `/api/moment` request (via the `Mono.zip`), even though geocoding/crypto would degrade gracefully on their own. Any caller of `/api/moment` should expect that a non-2xx response can still occur despite the other two services having no-throw fallbacks.

**Nothing is persisted.** `Moment` (`model/Moment.java`) is a plain Lombok `@Data` DTO built fresh per request from the three zipped results — there's no database, no repository layer, no server-side history of past requests.

## Planned frontend (decided, not yet built)

These decisions came out of product discussion and aren't reflected in any code yet, but should inform how the frontend gets scaffolded when that work starts:

- **Stack**: Expo (managed React Native), one codebase for iOS + Android.
- **Camera-only capture**: no photo upload, no picking from the camera roll — the only way a photo enters the app is live in-app capture.
- **Drafts, on-device only**: a saved moment (photo + overlay + `Moment` data) is a "draft," kept ~3 days before going stale. No backend persistence/sync for v1 — drafts never leave the device.
- **Dev workflow**: backend runs locally via the Docker steps above; the Expo app on a physical phone reaches it over LAN via the developer's machine IP (existing free-tier hosting for this backend has quota/IP-sharing issues, so it isn't used for frontend dev).
- **No backend changes anticipated** for the frontend's initial build — CORS doesn't apply to native RN networking, there's no auth, and no new endpoints are needed since drafts stay client-side.

A detailed implementation plan for this frontend (repo layout, dependency choices, screen flow, data model) exists and can be picked back up when that work starts.
