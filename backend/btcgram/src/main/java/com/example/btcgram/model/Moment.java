package com.example.btcgram.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Moment {
    private String city;
    private String country;
    private String timezone;
    private double temperature;
    private String condition;
    private String localTime;
    private double btcPriceUsd;
}