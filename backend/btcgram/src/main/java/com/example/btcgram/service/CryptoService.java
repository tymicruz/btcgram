package com.example.btcgram.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class CryptoService {

    private final WebClient webClient;
    private volatile Double cachedPrice;
    private volatile Instant lastFetched;
    private static final long CACHE_DURATION_SECONDS = 60;

    public CryptoService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("https://api.coingecko.com")
                .build();
    }

    public Mono<Double> getBtcPriceUsd() {
        if (cachedPrice != null && lastFetched != null
                && ChronoUnit.SECONDS.between(lastFetched, Instant.now()) < CACHE_DURATION_SECONDS) {
            return Mono.just(cachedPrice); // return cached value, skip the API call entirely
        }

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v3/simple/price")
                        .queryParam("ids", "bitcoin")
                        .queryParam("vs_currencies", "usd")
                        .build())
                .retrieve()
                .bodyToMono(CoinGeckoResponse.class)
                .map(response -> response.bitcoin().usd())
                .doOnNext(price -> {
                    cachedPrice = price;
                    lastFetched = Instant.now();
                })
                .onErrorReturn(0.0);

    }

    // Internal records matching CoinGecko's JSON shape
    private record CoinGeckoResponse(BitcoinPrice bitcoin) {
    }

    private record BitcoinPrice(double usd) {
    }
}