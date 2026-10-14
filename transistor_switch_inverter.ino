/*
 * ====================================================================================
 * Project: From Transistors to Qubits: A Hybrid Learning Framework
 * File: transistor_switch_inverter.ino
 * Target: Arduino Uno / Nano / ESP32 (compatible with any 3.3V/5V microcontroller)
 * Description: 
 *   Automated hardware characterization of a BJT/MOSFET transistor switch and 
 *   logic inverter (RTL NOT Gate). Provides digital toggling, Voltage Transfer
 *   Characteristic (VTC) sweeping, and noise margin exploration.
 * ====================================================================================
 */

// Pin Definitions
const int PIN_VIN_DRIVE = 9;   // PWM / Digital Output driving the Transistor Base via R_B
const int PIN_VIN_SENSE = A0;  // Analog input monitoring Base voltage V_in
const int PIN_VOUT_SENSE = A1; // Analog input monitoring Collector voltage V_out

// Operating Modes:
// 1 = Digital Square Wave Inverter Test (1 Hz toggle with Truth Table telemetry)
// 2 = VTC Sweep Mode (Ramps Vin 0V -> 5V to capture transfer characteristics)
// 3 = Noise Margin Test (Injects simulated noise perturbations)
int operationalMode = 1;

// Constants
const float V_REF = 5.0;       // Reference voltage (Change to 3.3 for ESP32)
const int ADC_RESOLUTION = 1023; // 10-bit ADC for Arduino Uno

void printBanner() {
  Serial.println(F("=================================================================="));
  Serial.println(F("  FROM TRANSISTORS TO QUBITS: HARDWARE CHARACTERIZATION BENCH     "));
  Serial.println(F("  University CSE Educational Demonstration Platform               "));
  Serial.println(F("=================================================================="));
  Serial.println(F("Commands:"));
  Serial.println(F("  Send '1' -> Digital Inverter Mode (Truth Table Verification)"));
  Serial.println(F("  Send '2' -> VTC Sweep Mode (Transfer Curve for Serial Plotter)"));
  Serial.println(F("  Send '3' -> Classical Noise & Margin Test"));
  Serial.println(F("=================================================================="));
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000); // Wait for serial port connection

  pinMode(PIN_VIN_DRIVE, OUTPUT);
  pinMode(PIN_VIN_SENSE, INPUT);
  pinMode(PIN_VOUT_SENSE, INPUT);

  printBanner();
}

float readVoltage(int pin) {
  int raw = analogRead(pin);
  return (raw / (float)ADC_RESOLUTION) * V_REF;
}

// Mode 1: Digital Inverter Test
void runDigitalInverterTest() {
  static unsigned long lastToggle = 0;
  static bool currentState = LOW;

  if (millis() - lastToggle >= 1500) {
    lastToggle = millis();
    currentState = !currentState;
    digitalWrite(PIN_VIN_DRIVE, currentState ? HIGH : LOW);

    // Allow circuit capacitances to settle
    delay(20);

    float vIn = readVoltage(PIN_VIN_SENSE);
    float vOut = readVoltage(PIN_VOUT_SENSE);

    int logicIn = (vIn > 2.0) ? 1 : 0;
    int logicOut = (vOut > 2.0) ? 1 : 0;

    Serial.println(F("--------------------------------------------------"));
    Serial.print(F("[DIGITAL NOT] Input: "));
    Serial.print(currentState ? "HIGH (1)" : "LOW  (0)");
    Serial.print(F(" | Vin = "));
    Serial.print(vIn, 2);
    Serial.print(F("V | Vout = "));
    Serial.print(vOut, 2);
    Serial.print(F("V | Logic Output = "));
    Serial.print(logicOut);
    Serial.print(F(" | Quantum Equivalent: X|"));
    Serial.print(logicIn);
    Serial.print(F("> = |"));
    Serial.print(logicOut);
    Serial.println(F(">"));
  }
}

// Mode 2: Voltage Transfer Characteristic (VTC) Sweep
void runVtcSweep() {
  Serial.println(F("Starting VTC Sweep... Switch to Serial Plotter (115200 baud) for visual curve!"));
  Serial.println(F("Vin_V,Vout_V,LogicThreshold_Ref"));

  for (int pwm = 0; pwm <= 255; pwm += 3) {
    analogWrite(PIN_VIN_DRIVE, pwm);
    delay(15); // settle time

    float vIn = readVoltage(PIN_VIN_SENSE);
    float vOut = readVoltage(PIN_VOUT_SENSE);

    // Format for Arduino Serial Plotter
    Serial.print(vIn, 3);
    Serial.print(F(" "));
    Serial.print(vOut, 3);
    Serial.print(F(" "));
    Serial.println(2.50); // Mid-rail reference logic threshold
  }

  analogWrite(PIN_VIN_DRIVE, 0); // Reset
  delay(1000);
}

// Mode 3: Classical Noise & Immunity Demonstration
void runNoiseTest() {
  Serial.println(F("=== Classical Noise Margin Test ==="));
  Serial.println(F("Injecting small voltage noise around logic levels to show noise immunity..."));

  // Test Logic 0 with increasing noise
  for (int noiseLevel = 0; noiseLevel <= 100; noiseLevel += 10) {
    int noisyPwm = noiseLevel; // Noise pushing 0V upwards
    analogWrite(PIN_VIN_DRIVE, noisyPwm);
    delay(30);

    float vIn = readVoltage(PIN_VIN_SENSE);
    float vOut = readVoltage(PIN_VOUT_SENSE);
    int bitDetected = (vOut < 2.0) ? 0 : 1; // Inverted

    Serial.print(F("Noise Offset: Vin = "));
    Serial.print(vIn, 2);
    Serial.print(F("V -> Vout = "));
    Serial.print(vOut, 2);
    Serial.print(F("V -> Read as Bit: "));
    Serial.print(bitDetected);
    if (vIn > 0.7 && bitDetected == 0) {
      Serial.println(F("  [!] BIT FLIP DETECTED (Noise exceeded threshold V_IL)"));
    } else {
      Serial.println(F("  [OK] Noise rejected by threshold margin"));
    }
  }

  analogWrite(PIN_VIN_DRIVE, 0);
  delay(2000);
}

void loop() {
  // Check for mode change via Serial command
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == '1') {
      operationalMode = 1;
      Serial.println(F(">> Switched to Mode 1: Digital Inverter"));
    } else if (cmd == '2') {
      operationalMode = 2;
      Serial.println(F(">> Switched to Mode 2: VTC Sweep"));
    } else if (cmd == '3') {
      operationalMode = 3;
      Serial.println(F(">> Switched to Mode 3: Noise Margin Test"));
    }
  }

  switch (operationalMode) {
    case 1:
      runDigitalInverterTest();
      break;
    case 2:
      runVtcSweep();
      operationalMode = 1; // Return to mode 1 after sweep
      break;
    case 3:
      runNoiseTest();
      operationalMode = 1; // Return to mode 1 after noise test
      break;
  }
}
