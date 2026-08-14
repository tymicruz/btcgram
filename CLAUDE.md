# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

btcgram is a Java/Spring Boot API that takes coordinates (`lat`/`lon`) and returns reverse-geocoded location, weather, local time, and current BTC price in one response, paired with an Expo (React Native) mobile app where a user takes a photo and the app overlays this location/weather/time/price data onto it as a shareable "moment" snapshot.

The backend lives at `backend/btcgram/` (Maven multi-directory layout — there is no root-level build file, everything Java lives under that subdirectory). The frontend lives at `frontend/` (Expo/TypeScript) — see "Frontend architecture" below.

**Versioning note**: `main` reflects v1 — camera capture, styled-data-overlay-in-progress, save straight to the camera roll, no auth, no persistence beyond the phone. v2 (built on the `dev` branch, done) adds real accounts (Supabase Auth, email/password and Google both working), a Feed backed by a real database, and posting Moments to the cloud instead of only saving them locally. `dev` is ready to merge into `main` as the new v1.

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

**Nothing is persisted in the Spring Boot backend itself.** `Moment` (`model/Moment.java`) is a plain Lombok `@Data` DTO built fresh per request from the three zipped results — no database, no repository layer, no server-side history of past requests, in this backend. (The frontend now has its own separate persistence via Supabase — see below — which this backend knows nothing about and isn't involved in.)

## Frontend architecture (`frontend/`, Expo/TypeScript)

**Camera-only capture**: no photo upload, no picking from the camera roll — the only way a photo enters the app is live in-app capture (`src/screens/CameraScreen.tsx`).

**Screens and navigation** (`src/navigation/RootNavigator.tsx`): a single native-stack navigator that conditionally renders one of two screen sets based on auth state (`src/context/AuthContext.tsx`, backed by Supabase's session):
- Not logged in → only `LoginScreen` (email/password, and Google sign-in via `@react-native-google-signin/google-signin` + Supabase's `signInWithIdToken`).
- Logged in → `FeedScreen` (list of the current user's Moments) → `CameraScreen` → `OverlayScreen` (shows the captured photo + this backend's `/api/moment` data, with Save-to-camera-roll and Post buttons) → `MomentDetailScreen` (opened by tapping a Feed item; Save-to-camera-roll and Delete).

**Auth, database, and photo storage are all Supabase**, not this Spring Boot backend (`src/lib/supabase.ts` is the shared client). This backend is only ever called for the read-only `/api/moment` lookup — nothing about auth/Moments storage touches it.
- **Auth**: Supabase Auth, email/password and Google sign-in. Session persisted via `AsyncStorage` (deliberately not the more-secure `expo-secure-store`/Keychain right now — swapped back on purpose to make the session easy to inspect while still learning how it works; revisit later). Google's provider has **"Skip nonce checks" enabled** in the Supabase dashboard — required because the free tier of `@react-native-google-signin/google-signin` doesn't expose control over the nonce it embeds in the ID token (that's a paid-only feature of the library), so Supabase can't verify one. Real trade-off (weakens one specific replay-attack protection), accepted deliberately given the alternative is a paid library.
- **Database**: a single `moments` Postgres table (schema + Row Level Security policies in `supabase/schema.sql`, with `supabase/add_delete_support.sql` as an already-applied incremental migration) — each row is one posted Moment, RLS-scoped so a user only ever sees/creates/deletes their own rows. No formal migrations tooling; schema changes are plain `.sql` files run by hand in Supabase's SQL Editor.
- **Storage**: a public `moments` Storage bucket, one file per Moment at `<user-id>/<timestamp>.jpg`, uploaded via `expo-file-system`'s `File` API + `base64-arraybuffer` (see `src/api/moments.ts` — `postMoment`/`deleteMoment`). The uploaded file is the *composed* image (photo + overlay baked in via `react-native-view-shot`'s `captureRef`), the same flow both Save-to-camera-roll and Post use.

**Save vs. Post are different actions**: Save writes the composed image to the phone's camera roll only (`expo-media-library`), no backend/Supabase involved. Post uploads it to Supabase Storage and creates a `moments` row, which is what makes it show up in the Feed.

**Dev workflow**: this backend runs locally via the Docker steps above; the Expo app on a physical phone reaches it over LAN via the developer's machine IP (existing free-tier hosting for this backend has quota/IP-sharing issues, so it isn't used for frontend dev). Supabase itself is a real hosted cloud service, reachable from anywhere — no local/LAN setup needed for the auth/Moments/storage pieces, only for this backend's `/api/moment` calls.

**Deferred, not decided against**: on-device drafts (save-before-posting, TikTok-style) were the original v1 plan but got superseded by posting straight to Supabase — still wanted eventually as its own dedicated piece of work, just not now. C2PA/cryptographically-verified Moments is documented as a future direction in the root `README.md`'s "Future roadmap" section — the actual next major initiative once v2 ships, not started.
