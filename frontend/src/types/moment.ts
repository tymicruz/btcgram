// Mirrors backend/btcgram/src/main/java/com/example/btcgram/model/Moment.java
export type Moment = {
  city: string;
  country: string;
  timezone: string;
  temperature: number;
  condition: string;
  localTime: string;
  btcPriceUsd: number;
};
