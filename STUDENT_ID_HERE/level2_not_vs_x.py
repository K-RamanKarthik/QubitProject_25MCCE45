#!/usr/bin/env python3
"""
========================================================================================
Project: From Transistors to Qubits: A Hybrid Learning Framework
Level 2: Logic Gate vs Quantum Gate (Transistor NOT vs Pauli-X Gate)
========================================================================================
Concept Bridge:
  Classical: RTL Inverter (Transistor Switch) maps 0V (Bit 0) -> 5V (Bit 1)
                                                 5V (Bit 1) -> 0V (Bit 0)
  Quantum:   Pauli-X Gate flips computational basis states:
             X |0> = |1>
             X |1> = |0>
  Superposition Property:
             Unlike the classical inverter, the X-gate acts linearly on superpositions:
             X (alpha|0> + beta|1>) = beta|0> + alpha|1>
========================================================================================
"""

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

def classical_not_gate(vin_volts: float, v_threshold: float = 0.7, v_supply: float = 5.0) -> dict:
    """
    Simulates a classical Resistor-Transistor Logic (RTL) BJT Inverter.
    When Vin > V_th (0.7V), transistor saturates: Vout = V_CE(sat) ~ 0.15V (Logic 0)
    When Vin < V_th (0.7V), transistor cut-off:   Vout = V_supply ~ 5.00V (Logic 1)
    """
    if vin_volts >= v_threshold:
        transistor_state = "SATURATION (Conducting / ON)"
        vout_volts = 0.15  # Saturation voltage V_CE(sat)
        logic_out = 0
    else:
        transistor_state = "CUT-OFF (Switch Open / OFF)"
        vout_volts = v_supply  # Pull-up through R_C
        logic_out = 1
        
    logic_in = 1 if vin_volts >= 2.0 else 0
    return {
        "Vin_V": vin_volts,
        "Logic_In": logic_in,
        "Transistor_State": transistor_state,
        "Vout_V": vout_volts,
        "Logic_Out": logic_out
    }

def quantum_x_gate_simulation():
    """
    Demonstrates the Pauli-X gate using linear algebra (NumPy) and Qiskit circuit simulation.
    """
    print("\n" + "="*70)
    print(" LEVEL 2: TRANSISTOR NOT GATE vs QUANTUM PAULI-X GATE")
    print("="*70)

    # 1. Classical RTL Inverter Demonstration
    print("\n--- [1] Classical RTL Transistor Inverter ---")
    test_voltages = [0.0, 0.4, 0.8, 3.3, 5.0]
    print(f"{'Vin (V)':<10} | {'Logic In':<10} | {'Transistor State':<30} | {'Vout (V)':<10} | {'Logic Out'}")
    print("-" * 75)
    for v in test_voltages:
        res = classical_not_gate(v)
        print(f"{res['Vin_V']:<10.2f} | {res['Logic_In']:<10} | {res['Transistor_State']:<30} | {res['Vout_V']:<10.2f} | {res['Logic_Out']}")

    # 2. Linear Algebra representation of Pauli-X
    print("\n--- [2] Quantum Pauli-X Matrix Representation ---")
    # Pauli-X Matrix:
    #   [0  1]
    #   [1  0]
    X = np.array([[0, 1], [1, 0]], dtype=complex)
    ket_0 = np.array([[1], [0]], dtype=complex)
    ket_1 = np.array([[0], [1]], dtype=complex)

    print("Pauli-X Matrix:\n", X)
    print("\nApplying X to |0>:\n", np.dot(X, ket_0), " -> Equivalent to |1>")
    print("Applying X to |1>:\n", np.dot(X, ket_1), " -> Equivalent to |0>")

    # 3. Superposition Action (Quantum Advantage / Coherence)
    print("\n--- [3] Superposition Action (Linearity) ---")
    # State |+> = (|0> + |1>) / sqrt(2)
    plus_state = (ket_0 + ket_1) / np.sqrt(2)
    print("Input State |+> = (|0> + |1>)/sqrt(2):")
    print(plus_state.flatten())
    x_on_plus = np.dot(X, plus_state)
    print("X |+> = (|1> + |0>)/sqrt(2) = |+> (Eigenstate with eigenvalue +1!):")
    print(x_on_plus.flatten())

    # 4. Qiskit Aer Circuit Simulation
    print("\n--- [4] Qiskit Circuit Execution & Measurement (AerSimulator) ---")
    
    # Circuit A: X applied to |0>
    qc = QuantumCircuit(1, 1)
    # Default initial state is |0>
    qc.x(0)
    qc.measure(0, 0)
    
    simulator = AerSimulator()
    job = simulator.run(qc, shots=1024)
    counts = job.result().get_counts()
    
    print("Quantum Circuit A: Initial |0> -> X -> Measure")
    print(f"Measurement Counts (1024 shots): {counts}")
    print("Conclusion: 100% deterministic flip from |0> to |1>.")

    # Statevector check
    sv_qc = QuantumCircuit(1)
    sv_qc.x(0)
    sv = Statevector.from_instruction(sv_qc)
    print(f"Final Statevector: {sv.data}")
    print("\n[SUCCESS] Level 2 validation complete.")

if __name__ == "__main__":
    quantum_x_gate_simulation()
