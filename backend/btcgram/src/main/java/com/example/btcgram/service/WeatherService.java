package com.example.btcgram.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

@Service
public class WeatherService {

    private final WebClient webClient;

    public WeatherService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("https://api.open-meteo.com")
                .build();
    }

    public Mono<WeatherResult> getCurrentWeather(double lat, double lon) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/forecast")
                        .queryParam("latitude", lat)
                        .queryParam("longitude", lon)
                        .queryParam("current", "temperature_2m,weather_code")
                        .queryParam("temperature_unit", "fahrenheit")
                        .queryParam("timezone", "auto")
                        .build())
                .retrieve()
                .bodyToMono(OpenMeteoResponse.class)
                .map(response -> new WeatherResult(
                        response.current().temperature_2m(),
                        describeWeatherCode(response.current().weather_code()), response.timezone(),
                        response.current().time()));
    }

    // Maps Open-Meteo's numeric WMO weather codes to plain-English conditions
    private String describeWeatherCode(int code) {
        return switch (code) {
            case 0 -> "Clear sky";
            case 1, 2, 3 -> "Partly cloudy";
            case 45, 48 -> "Fog";
            case 51, 53, 55 -> "Drizzle";
            case 61, 63, 65 -> "Rain";
            case 71, 73, 75 -> "Snow";
            case 80, 81, 82 -> "Rain showers";
            case 95, 96, 99 -> "Thunderstorm";
            default -> "Unknown";
        };
    }

    // Internal records matching Open-Meteo's JSON shape
    private record OpenMeteoResponse(String timezone, CurrentWeather current) {
    }

    private record CurrentWeather(double temperature_2m, int weather_code, String time) {
    }

    // What we hand back to the rest of the app
    public record WeatherResult(double temperature, String condition, String timezone, String localTime) {
    }
}