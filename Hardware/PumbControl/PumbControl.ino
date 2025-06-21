#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <WebServer.h>

const char* ssid = "Ali";
const char* password = "12345678";

#define API_KEY "******************"
#define DATABASE_URL "******************"
#define USER_EMAIL "************"
#define USER_PASSWORD "****************"

const int motorPin = 5;
bool motorState = false;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

WebServer server(80);

void testMotor() {
  Serial.println("\n[TEST] Starting motor test...");
  for (int i = 0; i < 3; i++) {
    digitalWrite(motorPin, LOW);  // Motor ON
    Serial.println(">> Motor ON (Pin LOW)");
    delay(1000);
    digitalWrite(motorPin, HIGH); // Motor OFF
    Serial.println(">> Motor OFF (Pin HIGH)");
    delay(1000);
  }
  Serial.println("[TEST] Motor test complete\n");
}

void streamCallback(FirebaseStream data) {
  Serial.println("\n[FIREBASE] Stream Data Received");
  
  // Debug print all received data
  Serial.printf("Path: %s\n", data.dataPath().c_str());
  Serial.printf("Type: %s\n", data.dataType().c_str());
  Serial.printf("Event: %s\n", data.eventType().c_str());
  Serial.printf("JSON: %s\n", data.jsonString().c_str());

  // Handle JSON object with state field
  if (data.dataType() == "json") {
    FirebaseJsonData jsonData;
    data.jsonObject().get(jsonData, "state");
    
    if (jsonData.typeNum == FirebaseJson::JSON_BOOL) {
      bool state = jsonData.boolValue;
      digitalWrite(motorPin, state ? LOW : HIGH);
      motorState = state;
      Serial.printf("[MOTOR] Set to %s via Firebase\n", state ? "ON" : "OFF");
    }
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) {
    Serial.println("[FIREBASE] Stream timeout, reconnecting...");
    if (!Firebase.RTDB.beginStream(&fbdo, "/pump")) {
      Serial.println("[FIREBASE] Stream reconnect failed: " + fbdo.errorReason());
    }
  }
}

void setupFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  fbdo.setBSSLBufferSize(4096, 1024);
  fbdo.setResponseSize(2048);
  
  Firebase.reconnectNetwork(true);
  Firebase.begin(&config, &auth);
  Firebase.setDoubleDigits(5);

  Serial.print("Connecting to Firebase");
  while (!Firebase.ready()) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nFirebase connected!");

  if (!Firebase.RTDB.beginStream(&fbdo, "/pump")) {
    Serial.println("[FIREBASE] Stream begin error: " + fbdo.errorReason());
  } else {
    Firebase.RTDB.setStreamCallback(&fbdo, streamCallback, streamTimeoutCallback);
    Serial.println("[FIREBASE] Stream started successfully");
  }
}

void handleOn() {
  digitalWrite(motorPin, LOW);
  motorState = true;
  server.send(200, "text/plain", "Motor ON");
  
  if (Firebase.RTDB.setBool(&fbdo, "/pump/state", true)) {
    Serial.println("[FIREBASE] State updated to ON");
  }
}

void handleOff() {
  digitalWrite(motorPin, HIGH);
  motorState = false;
  server.send(200, "text/plain", "Motor OFF");
  
  if (Firebase.RTDB.setBool(&fbdo, "/pump/state", false)) {
    Serial.println("[FIREBASE] State updated to OFF");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(motorPin,OUTPUT_OPEN_DRAIN);
  digitalWrite(motorPin, HIGH); // Start with motor OFF

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected with IP: " + WiFi.localIP().toString());

  //testMotor();
  setupFirebase();

  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
  
  // Handle stream errors
  if (fbdo.streamTimeout()) {
    Serial.println("[FIREBASE] Stream timeout detected");
    if (!Firebase.RTDB.beginStream(&fbdo, "/pump")) {
      Serial.println("[FIREBASE] Stream restart failed: " + fbdo.errorReason());
    }
  }
  
  delay(100); // Small delay to prevent watchdog timer issues
}