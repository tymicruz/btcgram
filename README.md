# btcgram

A Java/Spring Boot API that takes coordinates and returns reverse geolocation, weather, local time, and current BTC price — all in one response.

## Status

- ✅ Reverse geocoding (city, country) via [Nominatim](https://nominatim.org/)
- ⬜ Weather (not yet implemented)
- ⬜ Local time (not yet implemented)
- ⬜ BTC price (not yet implemented)

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

**Tokyo:**
```
http://localhost:8080/api/moment?lat=35.6762&lon=139.6503
```

**Rural New Hampshire (tests city/town/village fallback):**
```
http://localhost:8080/api/moment?lat=44.2601&lon=-71.3773
```

### Example response

```json
{
  "city": "City of New York",
  "country": "United States",
  "timezone": null,
  "temperature": 0.0,
  "condition": null,
  "localTime": null,
  "btcPriceUsd": 0.0
}
```

> Note: `timezone`, `temperature`, `condition`, `localTime`, and `btcPriceUsd` are currently placeholders (`null`/`0.0`) — weather, time, and BTC price services are not yet implemented.

## Project structure

```
backend/btcgram/src/main/java/com/example/btcgram/
├── BtcgramApplication.java   # Main entry point
├── config/
│   └── WebClientConfig.java  # Shared WebClient bean for HTTP calls
├── controller/
│   └── MomentController.java # REST endpoint (/api/moment)
├── service/
│   └── GeocodingService.java # Calls Nominatim for reverse geocoding
└── model/
    └── Moment.java            # Combined response object
```
