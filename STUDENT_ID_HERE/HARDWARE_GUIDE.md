# Hardware Guide: From Transistors to Qubits
## Physical Circuit Laboratory Guide (BJT / MOSFET Inverter & Switch)

---

### 1. Introduction & Academic Objective
Before exploring quantum states, superpositions, and quantum logic gates, students must master how physical classical bits ($0$ and $1$) are established in hardware. 
In classical digital computers, bits are **not** abstract mathematical entities; they are discrete voltage bands created by semiconductor switches (transistors).

This lab module guides you through building:
1. **Circuit 1: The Transistor Switch** ($V_{in} \to \text{Transistor} \to \text{LED}$)
2. **Circuit 2: The RTL (Resistor-Transistor Logic) NOT Gate / Inverter** ($V_{in} \to \overline{V_{out}}$)
3. **Arduino/ESP32 Automated Test Interface** to sweep voltages, measure threshold margins, and stream data to the Serial Plotter.

---

### 2. Bill of Materials (BOM)

| Component | Specification / Value | Quantity | Purpose |
| :--- | :--- | :--- | :--- |
| **Transistor** | NPN BJT (2N2222, BC547, or PN2222) *or* N-Ch MOSFET (2N7000) | 1-2 | Electronic switch element |
| **Base / Gate Resistor ($R_B$)** | $1\,\text{k}\Omega$ to $4.7\,\text{k}\Omega$ ($0.25\,\text{W}$) | 1 | Limits base current $I_B$ to prevent BJT thermal damage |
| **Collector Pull-Up Resistor ($R_C$)**| $1\,\text{k}\Omega$ to $10\,\text{k}\Omega$ ($0.25\,\text{W}$) | 1 | Pull-up resistor for RTL Inverter configuration |
| **LED Current Limiting Resistor ($R_{LED}$)** | $220\,\Omega$ to $330\,\Omega$ ($0.25\,\text{W}$) | 1 | Protects LED from overcurrent |
| **LED** | 5mm Standard Red or Green ($V_f \approx 1.8\text{V}-2.1\text{V}$) | 1 | Visual indicator of classical bit output |
| **Microcontroller** | Arduino Uno, Nano, ESP32, or STM32 | 1 | Automated pulse generator, ADC telemetry, and PWM swept input |
| **Breadboard** | Standard 400-point or 830-point solderless | 1 | Prototyping matrix |
| **Jumper Wires** | Male-to-Male DuPont wires | 8-10 | Connections |
| **Multimeter (Optional)**| Digital Multimeter (DMM) | 1 | Verifying $V_{BE}$, $V_{CE}$, and voltage drop |

---

### 3. Pinout & Component Identification

#### NPN BJT Pinout (2N2222 / BC547)
Looking at the flat face with leads pointing downward:

```
    2N2222 (TO-92)                  BC547 (TO-92)
     .--------.                      .--------.
    /  FLAT    \                    /  FLAT    \
   |   SIDE     |                  |   SIDE     |
   '------------'                  '------------'
     |    |   |                      |    |   |
     1    2   3                      1    2   3
     E    B   C                      C    B   E
   (Emitter, Base, Collector)      (Collector, Base, Emitter)
```
> [!CAUTION]
> Always verify your specific transistor package datasheet! 2N2222 and BC547 have opposite Collector/Emitter orientations.

---

### 4. Circuit Schematics & Breadboard Connections

#### Circuit 1: Transistor Switch (Direct LED Load)
Here the LED is connected in series with the collector. When the transistor conducts (turns ON), the LED illuminates.

```text
               +5V (from Arduino)
                |
                +----+
                     |
                    [ ] R_LED (330 Ohm)
                     |
                    _|_ LED (Anode)
                    \ /
                   ----- (Cathode)
                     |
                     +---> Collector (C)
                           |
Arduino D9 ----[ 1k R_B ]--+ Base (B)  [NPN BJT: 2N2222]
(Control In)               |
                     +---> Emitter (E)
                     |
                    GND (Arduino GND)
```

**Operation:**
- $V_{in} < 0.6\,\text{V}$: Transistor is in **Cut-off**. $I_B \approx 0$, $I_C \approx 0$. LED is **OFF** (Bit $0$).
- $V_{in} \ge 0.7\,\text{V}$ (Arduino HIGH $\approx 5\,\text{V}$): Base-Emitter junction forward biased. $I_B = (5 - 0.7)/1000 \approx 4.3\,\text{mA}$. Transistor is driven into **Saturation**. Collector-Emitter voltage drops to $V_{CE(sat)} \approx 0.1\,\text{V}-0.2\,\text{V}$. Full current flows through LED. LED is **ON** (Bit $1$).

---

#### Circuit 2: The RTL NOT Gate (Logic Inverter)
In a true logic inverter, the output voltage is taken at the Collector terminal $V_{out}$.

```text
               +5V (from Arduino)
                |
                +----+
                |    |
               [ ]  [ ]
               [ ]  [ ] R_C (1 kOhm Pull-Up)
                |    |
                |    +----------------------> V_out (To Arduino A1 & Scope)
                |    |                        |
                |    |                       [ ] R_LED (330 Ohm)
                |    |                        |
                |    |                       _|_ LED
                |    |                       \ /
                |    |                      -----
                |    |                        |
                |    +---> Collector (C)     GND
                |          |
Arduino D9 -----+-[1k R_B]-+ Base (B)
(V_in Input)               |
                     +---> Emitter (E)
                     |
                    GND (Common Ground)
```

**Truth Table & Voltage Transfer:**

| Logic Input ($V_{in}$) | Base Current $I_B$ | Transistor State | Output Voltage ($V_{out}$) | Logic Output ($\overline{V_{in}}$) | LED Status |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **$0$ (LOW, $0\text{V}$)** | $0\,\mu\text{A}$ | **Cut-Off** (Switch Open) | $+5.0\,\text{V}$ (High via $R_C$) | **$1$ (HIGH)** | **ON** |
| **$1$ (HIGH, $5\text{V}$)** | $\approx 4.3\,\text{mA}$ | **Saturation** (Switch Closed) | $\approx 0.15\,\text{V}$ ($V_{CE(sat)}$) | **$0$ (LOW)** | **OFF** |

---

### 5. Arduino / ESP32 Interfacing & Telemetry

Connect the Arduino as follows:
- **Pin D9 (PWM / Digital Out)** $\to$ Input $V_{in}$ via $R_B$ ($1\,\text{k}\Omega$).
- **Pin A0 (Analog In)** $\to$ Input Voltage Monitor ($V_{in}$).
- **Pin A1 (Analog In)** $\to$ Output Voltage Monitor ($V_{out}$ at Collector).
- **Pin 5V & GND** $\to$ Breadboard power rails.

The companion sketch `transistor_switch_inverter.ino` provides:
1. **Manual / Square Wave Mode**: Toggles $0 \leftrightarrow 1$ at $1\,\text{Hz}$ to visually demonstrate NOT inversion.
2. **Voltage Sweep Mode (VTC - Voltage Transfer Characteristic)**: Ramps $V_{in}$ smoothly from $0\,\text{V}$ to $5\,\text{V}$ using PWM/RC filter to plot the transition threshold ($V_{th} \approx 0.65\,\text{V}$) on the Arduino Serial Plotter.
3. **Noise Injection Mode**: Adds simulated electrical noise perturbations to test logic noise margins ($V_{IL}, V_{IH}$).

---

### 6. Quantum Mapping Correlation
In your report and viva, explain this exact bridge:
- **Physical Cut-Off vs Saturation**: A physical transistor relies on millions of electrons crossing a depletion region to collapse the collector voltage to near zero.
- **RTL Inverter vs Pauli-$X$**: The RTL inverter inverts physical voltage levels:
  $$\text{NOT}(0\text{V}) = 5\text{V}, \quad \text{NOT}(5\text{V}) = 0\text{V}$$
  In quantum computing, the Pauli-$X$ operator inverts computational basis states:
  $$X |0\rangle = |1\rangle, \quad X |1\rangle = |0\rangle$$
  represented as matrix multiplication:
  $$\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} 1 \\ 0 \end{pmatrix} = \begin{pmatrix} 0 \\ 1 \end{pmatrix}$$
- **Crucial Difference**: While the BJT output is bounded strictly to $0$ or $1$, the quantum $X$ gate can act on linear superpositions:
  $$X (\alpha|0\rangle + \beta|1\rangle) = \beta|0\rangle + \alpha|1\rangle$$
  preserving coherence, which no classical transistor switch can achieve!
