# btcgram

A Java/Spring Boot API that takes coordinates and returns reverse geolocation, weather, local time, and current BTC price — all in one response.

This is the **backend** for a larger project: the plan is to pair this API with a frontend that lets a user take a photo, then overlay this location/weather/time/price data directly onto the image — a shareable "moment" snapshot.

## Status

### Backend (this repo)
- ✅ Reverse geocoding (city, country) via [Nominatim](https://nominatim.org/)
- ✅ Weather (temperature, condition) via [Open-Meteo](https://open-meteo.com/)
- ✅ Timezone and local time via Open-Meteo
- ✅ BTC price (USD) via [CoinGecko](https://www.coingecko.com/en/api), cached for 60s
- ⬜ Deployment (on hold — evaluating free hosting options; local development only for now)

### Known issues / not yet handled
- If a coordinate has no matching address (e.g. open ocean), `city`/`country` may come back as `"Unknown"` in some cases and raw `null` in others — needs consistent handling
- Weather/timezone/time are still fetched even when location is unknown — should be skipped in that case
- BTC price falls back to `0.0` if CoinGecko fails after the cache expires — may change to `null` later to distinguish "no data" from "price is actually zero"

### Frontend (`frontend/`, Expo / React Native — in progress)

Camera-only capture (no upload, no camera-roll picker), overlays this API's data onto the photo, then saves the result straight to the phone's camera roll. Built one milestone at a time, each checked off once it's running on a physical device:

- ✅ 1. Scaffold a blank Expo (TypeScript) app, running on a physical device via Expo Go
- ✅ 2. "Hello, btcgram!" placeholder screen (confirms the dev loop works)
- ✅ 3. Live camera preview
- ⬜ 4. Capture a photo and display it
- ⬜ 5. Two-screen navigation (Camera → Overlay)
- ⬜ 6. Fetch device location
- ⬜ 7. Call `/api/moment` with that location and display the raw response
- ⬜ 8. Styled overlay (city, weather, local time, BTC price laid over the photo)
- ⬜ 9. Save the composed image to the camera roll
- ⬜ 10. Error/loading states polish pass (permissions, network failures, sentinel values)

Local dev: run the backend via Docker (see above), point the Expo app at your machine's LAN IP so a physical phone can reach it over Wi-Fi. See `CLAUDE.md` for the full architecture/decisions behind this.

## Tech stack

- Java 25 (Temurin)
- Spring Boot 4.1.0
- Maven

## Running locally

### Prerequisites

- Java 25 installed ([Adoptium/Temurin](https://adoptium.net))
- No Maven installation needed — the project includes the Maven wrapper (`mvnw`)

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/tymicruz/btcgram.git
   cd btcgram/backend/btcgram
   ```

2. Run the app:
   ```bash
   ./mvnw spring-boot:run
   ```
   (Windows: `mvnw.cmd spring-boot:run`)

3. Wait for the console to show:
   ```
   Started BtcgramApplication in X.XXX seconds
   Tomcat started on port 8080
   ```

4. The API is now available at `http://localhost:8080`

### Running with Docker locally

A `Dockerfile` is included (`backend/btcgram/Dockerfile`) if you'd rather not install Java/Maven locally, or want to run the backend for a device on your local network (e.g. testing a mobile app over Wi-Fi).

```bash
cd backend/btcgram
docker build -t btcgram .
docker run -p 8080:8080 btcgram
```

- `docker build -t btcgram .` runs a two-stage build (Maven build → copies the jar into a slim `eclipse-temurin:25-jre-alpine` image) and tags it `btcgram`.
- `docker run -p 8080:8080 btcgram` starts the container, mapping container port 8080 to your machine's port 8080.
- The API is then available at `http://localhost:8080`, and at `http://<your-machine's-LAN-IP>:8080` from other devices on the same network (e.g. a phone testing a client app against this backend).
- Add `-d` to `docker run` to run it detached; stop it with `docker ps` + `docker stop <container-id>` (or `Ctrl+C` if running in the foreground).

## Testing the API

### Endpoint

```
GET /api/moment?lat={latitude}&lon={longitude}
```

### Example requests

**New York City:**
```
http://localhost:8080/api/moment?lat=40.7128&lon=-74.0060
```

**London:**
```
http://localhost:8080/api/moment?lat=51.5074&lon=-0.1278
```

**Tokyo:**
```
http://localhost:8080/api/moment?lat=35.6762&lon=139.6503
```

**Rural New Hampshire (tests city/town/village fallback):**
```
http://localhost:8080/api/moment?lat=44.2601&lon=-71.3773
```

**Open Pacific Ocean (tests "no address found" handling):**
```
http://localhost:8080/api/moment?lat=0.0&lon=-160.0
```

### Example response

```json
{
  "city": "New York",
  "country": "United States",
  "timezone": "America/New_York",
  "temperature": 72.5,
  "condition": "Clear sky",
  "localTime": "2026-07-29T19:24",
  "btcPriceUsd": 68234.12
}
```

> Note: `temperature` is returned in **Fahrenheit** (`temperature_unit=fahrenheit` is set in `WeatherService`).

## Project structure

```
backend/btcgram/src/main/java/com/example/btcgram/
├── BtcgramApplication.java     # Main entry point
├── config/
│   └── WebClientConfig.java   # Shared WebClient bean for HTTP calls
├── controller/
│   └── MomentController.java  # REST endpoint (/api/moment)
├── service/
│   ├── GeocodingService.java  # Calls Nominatim for reverse geocoding
│   ├── WeatherService.java    # Calls Open-Meteo for weather, timezone, local time
│   └── CryptoService.java     # Calls CoinGecko for BTC price, with caching
└── model/
    └── Moment.java             # Combined response object
```