# From Transistors to Qubits: A Hybrid Learning Framework
## University Computer Science & Engineering (3rd Semester) Capstone Assignment

---

### Project Overview
This repository contains the complete solution for the university project:  
**"From Transistors to Qubits: A Hybrid Learning Framework for Understanding Quantum Computing through Semiconductor Concepts"**

It maps fundamental semiconductor electronics (BJTs, MOSFETs, RTL inverters, noise margins) into quantum computing concepts (qubits, Bloch sphere, Pauli-X, Hadamard transforms, reversible circuits, and quantum error correction).

---

### Single Consolidated Directory Structure
All project deliverables are stored directly in this single folder (`STUDENT_ID_HERE/`) for easy viewing and submission:

```text
STUDENT_ID_HERE/
├── index.html                 # Interactive single-page educational platform (Levels 1-4 & Modules A-D)
├── styles.css                 # Clean modern responsive UI styling (dark & light theme support)
├── app.js                     # Full simulation engines (transistor IV curves, Bloch sphere, QEC, MCQs)
├── requirements.txt           # Virtual environment dependencies (Qiskit 2.x, Aer, NumPy, Matplotlib)
├── level2_not_vs_x.py         # Transistor NOT vs Pauli-X gate simulation
├── level3_hadamard.py         # Bit-to-Qubit transition & wave interference demo
├── level4_circuits.py         # Classical half-adder vs Quantum reversible circuit
├── noise_models.py            # Classical Gaussian jitter vs Decoherence & Pauli noise
├── qec_3qubit_code.py         # 3-Qubit bit-flip repetition code with syndrome recovery
├── run_all.py                 # Automated master test runner that validates all scripts
├── transistor_switch_inverter.ino # Arduino/ESP32 sketch with VTC sweep & noise tests
├── HARDWARE_GUIDE.md          # Bill of Materials, schematics, and wiring guide
├── report.docx                # Professional Microsoft Word report (styled with tables)
├── report.tex                 # Publication-ready LaTeX source file (for Overleaf/PDF)
├── report.txt                 # Comprehensive plain-text academic report
└── README.md                  # This quickstart documentation
```

---

### Quick Start Guide

#### 1. Interactive Web Application
The web app is entirely self-contained with zero external server dependencies:
- Simply double-click [`index.html`](file:///c:/antigravity%20stuff/edcProject1/STUDENT_ID_HERE/index.html) in your file explorer, or open it in any modern browser (Chrome, Edge, Firefox, Safari).
- Or run a local HTTP server:
  ```bash
  python -m http.server 8000
  ```
  and visit `http://localhost:8000/index.html` in your browser.
- **Key Features to Explore:**
  - **4 Levels Tab:** Walk through the semiconductor switch, inverter vs Pauli-X, Hadamard superposition, and dual half-adder circuits.
  - **Module A:** Tweak $V_{BE}$, $V_{th}$, and $R_L$ sliders to see the live DC load line and Q-point shift.
  - **Module C:** Click quantum gates ($X, H, Z, Y, S$), watch the live 3D Bloch sphere rotate, and trigger 1024-shot Monte Carlo measurement histograms.
  - **Noise & QEC Lab:** Inject bit-flip errors on individual qubits and watch the syndrome decoder restore the state.
  - **Evaluation Tab:** Take the 10-question pre-test, proceed through the lab, take the post-test, and inspect your calculated Hake's normalized gain ($g$).

---

#### 2. Python & Qiskit Suite Setup
All Python code is compatible with standard Python $\ge 3.10$ and modern Qiskit ($2.x$ with `qiskit-aer`).

1. **Activate the Virtual Environment (already prepared in `venv`):**
   - **On Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **On Windows (Command Prompt):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **On Linux/macOS:**
     ```bash
     source venv/bin/activate
     ```

2. **Run the Master Test Runner:**
   ```bash
   python run_all.py
   ```
   *Expected Output: All 5 modules report `PASS [OK]` and display detailed quantum statevectors and measurement counts.*

3. **Run Individual Modules:**
   ```bash
   python level2_not_vs_x.py
   python level3_hadamard.py
   python level4_circuits.py
   python noise_models.py
   python qec_3qubit_code.py
   ```

---

#### 3. Arduino / ESP32 Hardware Circuit
1. Refer to [`HARDWARE_GUIDE.md`](file:///c:/antigravity%20stuff/edcProject1/STUDENT_ID_HERE/HARDWARE_GUIDE.md) for the wiring diagram and Bill of Materials (NPN BJT 2N2222, $1\,\text{k}\Omega$ resistor, $330\,\Omega$ resistor, and LED).
2. Open [`transistor_switch_inverter.ino`](file:///c:/antigravity%20stuff/edcProject1/STUDENT_ID_HERE/transistor_switch_inverter.ino) in the Arduino IDE.
3. Select your board (e.g., Arduino Uno) and COM port, then click **Upload**.
4. Open the **Serial Monitor** at **115200 baud**:
   - Send `'1'` to view digital inverter toggling and truth table logs.
   - Send `'2'` and open the **Serial Plotter** to view the live Voltage Transfer Characteristic (VTC) curve.
   - Send `'3'` to test noise immunity margins.

---

- The report is provided in three convenient formats:
  - [`report.docx`](file:///c:/antigravity%20stuff/edcProject1/STUDENT_ID_HERE/report.docx): Formatted Microsoft Word document with tables and styled headings.
  - [`report.tex`](file:///c:/antigravity%20stuff/edcProject1/STUDENT_ID_HERE/report.tex): Publication-grade LaTeX source file (ready to copy-paste into Overleaf to download as PDF).
  - [`report.txt`](file:///c:/antigravity%20stuff/edcProject1/STUDENT_ID_HERE/report.txt): Clean plain-text version with ASCII tables.
- Replace `[STUDENT_NAME_HERE]` and `[STUDENT_ID_HERE]` with your details.
- Paste your physical circuit photo, Arduino Serial Plotter curve, and Web App simulator screenshots into the designated placeholders.
- Study **Section 7: Viva Voce Comprehensive Preparation Guide** for common questions asked during external lab vivas.

---

### Preparing for Submission (Single Zip File)
1. Rename the folder from `STUDENT_ID_HERE` to your actual university student ID or roll number (e.g., `23CS01045`).
2. Update your student ID and name inside [`report.txt`](file:///c:/antigravity%20stuff/edcProject1/STUDENT_ID_HERE/report.txt).
3. Right-click the folder and select **Compress to ZIP file** (or `zip -r 23CS01045.zip 23CS01045/`).
4. Submit the resulting `.zip` file to your university portal!
