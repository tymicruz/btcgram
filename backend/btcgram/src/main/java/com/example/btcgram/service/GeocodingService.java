package com.example.btcgram.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
public class GeocodingService {

    private final WebClient webClient;

    public GeocodingService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("https://nominatim.openstreetmap.org")
                .defaultHeader("User-Agent", "btcgram-app")
                .build();
    }

    public Mono<GeocodingResult> reverseGeocode(double lat, double lon) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/reverse")
                        .queryParam("lat", lat)
                        .queryParam("lon", lon)
                        .queryParam("format", "json")
                        .queryParam("accept-language", "en")
                        .build())
                .retrieve()
                .bodyToMono(NominatimResponse.class)
                .map(response -> {
                    if (response.address() == null) {
                        return new GeocodingResult("Unknown", "Unknown", null);
                    }
                    return new GeocodingResult(
                            response.address().bestCityGuess(),
                            response.address().country(),
                            response.address().countryCode());
                })
                .onErrorReturn(new GeocodingResult("Unavailable", "Unavailable", null));
    }

    public Mono<String> debugRawResponse(double lat, double lon) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/reverse")
                        .queryParam("lat", lat)
                        .queryParam("lon", lon)
                        .queryParam("format", "json")
                        .queryParam("accept-language", "en")
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(node -> JsonMapper.builder()
                        .build()
                        .writerWithDefaultPrettyPrinter()
                        .writeValueAsString(node));
    }

    // Small internal records just to parse Nominatim's JSON shape
    private record NominatimResponse(Address address) {
    }

    private record Address(
            String city,
            String town,
            String village,
            String hamlet,
            String county,
            String country,
            String country_code) {
        public String countryCode() {
            return country_code;
        }

        public String bestCityGuess() {
            if (city != null)
                return city;
            if (town != null)
                return town;
            if (village != null)
                return village;
            if (hamlet != null)
                return hamlet;
            return county; // last resort — broader region name
        }
    }

    // What we actually hand back to the rest of the app
    public record GeocodingResult(String city, String country, String countryCode) {
    }
}