package com.example.btcgram.controller;

import com.example.btcgram.model.Moment;
import com.example.btcgram.service.CryptoService;
import com.example.btcgram.service.GeocodingService;
import com.example.btcgram.service.WeatherService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class MomentController {

    private final GeocodingService geocodingService;
    private final WeatherService weatherService;
    private final CryptoService cryptoService;

    public MomentController(GeocodingService geocodingService, WeatherService weatherService,
            CryptoService cryptoService) {
        this.geocodingService = geocodingService;
        this.weatherService = weatherService;
        this.cryptoService = cryptoService;
    }

    @GetMapping(value = "/api/debug/raw", produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    public Mono<String> getRaw(@RequestParam double lat, @RequestParam double lon) {
        return geocodingService.debugRawResponse(lat, lon);
    }

    @GetMapping("/api/moment")
    public Mono<Moment> getMoment(@RequestParam double lat, @RequestParam double lon) {
        Mono<GeocodingService.GeocodingResult> geoMono = geocodingService.reverseGeocode(lat, lon);
        Mono<WeatherService.WeatherResult> weatherMono = weatherService.getCurrentWeather(lat, lon);
        Mono<Double> btcMono = cryptoService.getBtcPriceUsd();

        return Mono.zip(geoMono, weatherMono, btcMono)
                .map(tuple -> {
                    GeocodingService.GeocodingResult geo = tuple.getT1();
                    WeatherService.WeatherResult weather = tuple.getT2();
                    Double btcPrice = tuple.getT3();

                    return new Moment(
                            geo.city(),
                            geo.country(),
                            weather.timezone(), // timezone - not yet implemented
                            weather.temperature(),
                            weather.condition(),
                            weather.localTime(), // localTime - not yet implemented
                            btcPrice // btcPriceUsd - not yet implemented
                    );
                });
    }
}