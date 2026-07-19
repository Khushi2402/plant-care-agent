#include <WiFi.h>
#include <HTTPClient.h>
#include "secrets.h"

const int sensorPin = 34;
const int dryValue = 3216;
const int wetValue = 1375;

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
}

void loop() {
  int rawValue = analogRead(sensorPin);
  int moisturePct = map(rawValue, dryValue, wetValue, 0, 100);
  moisturePct = constrain(moisturePct, 0, 100);

  Serial.print("Raw: ");
  Serial.print(rawValue);
  Serial.print("  |  Moisture: ");
  Serial.print(moisturePct);
  Serial.println("%");

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SUPABASE_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_KEY);

    String payload = "{\"plant_id\":\"plant_1\",\"moisture_raw\":" + String(rawValue) +
                      ",\"moisture_pct\":" + String(moisturePct) + "}";

    int httpCode = http.POST(payload);
    Serial.print("Supabase response code: ");
    Serial.println(httpCode);

    http.end();
  } else {
    Serial.println("WiFi not connected, skipping upload.");
  }

  delay(300000); // 5 minutes between uploads
}
