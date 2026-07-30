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

### Frontend (not started)
- ⬜ Take/upload a photo
- ⬜ Call this API with the photo's location (or user's current location)
- ⬜ Overlay location, weather, time, and BTC price onto the image
- ⬜ Save/share the result

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