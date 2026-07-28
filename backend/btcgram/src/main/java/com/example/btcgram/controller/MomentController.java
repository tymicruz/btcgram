package com.example.btcgram.controller;

import com.example.btcgram.model.Moment;
import com.example.btcgram.service.GeocodingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class MomentController {

    private final GeocodingService geocodingService;

    public MomentController(GeocodingService geocodingService) {
        this.geocodingService = geocodingService;
    }

    @GetMapping(value = "/api/debug/raw", produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    public Mono<String> getRaw(@RequestParam double lat, @RequestParam double lon) {
        return geocodingService.debugRawResponse(lat, lon);
    }

    @GetMapping("/api/moment")
    public Mono<Moment> getMoment(@RequestParam double lat, @RequestParam double lon) {
        return geocodingService.reverseGeocode(lat, lon)
                .map(geo -> new Moment(
                        geo.city(),
                        geo.country(),
                        null, // timezone - not yet implemented
                        0.0, // temperature - not yet implemented
                        null, // condition - not yet implemented
                        null, // localTime - not yet implemented
                        0.0 // btcPriceUsd - not yet implemented
                ));
    }
}