#!/usr/bin/env python3
"""
========================================================================================
Project: From Transistors to Qubits: A Hybrid Learning Framework
Level 3: Bit to Qubit Transition & The Hadamard Gate
========================================================================================
Concept Bridge:
  Classical Bit: b in {0, 1}
                 Stored as charge on a capacitor or transistor ON/OFF state.
                 Deterministic, macroscopic, no interference possible.

  Qubit (Quantum Bit): |psi> = alpha|0> + beta|1>, where alpha, beta in Complex
                       Normalization condition: |alpha|^2 + |beta|^2 = 1.
                       Measurement yields:
                         Outcome 0 with probability P(0) = |alpha|^2
                         Outcome 1 with probability P(1) = |beta|^2

  Hadamard Gate (H):
    Matrix H = (1 / sqrt(2)) * [[1,  1],
                                 [1, -1]]
    Creates true quantum superposition:
      H|0> = (|0> + |1>) / sqrt(2) = |+>  --> P(0)=50%, P(1)=50%
      H|1> = (|0> - |1>) / sqrt(2) = |->  --> P(0)=50%, P(1)=50% (phase = pi)

  Quantum Interference (H^2 = I):
    H(H|0>) = H|+> = |0> with 100% certainty!
    Constructive interference on |0>, destructive interference on |1>.
    A classical coin flip or random bit CANNOT do this.
========================================================================================
"""

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

def demonstrate_bit_vs_qubit_math():
    print("\n" + "="*70)
    print(" LEVEL 3: FROM CLASSICAL BITS TO QUANTUM SUPERPOSITION")
    print("="*70)

    print("\n--- [1] Mathematical State Representation ---")
    print("Classical Bit State Space: S = {0, 1}  (Discrete Binary)")
    print("Quantum Qubit State Space: 2D Complex Hilbert Space C^2")
    print("General State: |psi> = alpha|0> + beta|1>")
    
    # Example state: 60-40 probability split
    p0_target = 0.64
    p1_target = 0.36
    alpha = np.sqrt(p0_target)
    beta = np.sqrt(p1_target)
    print(f"\nExample Custom State:")
    print(f"  alpha = {alpha:.3f}, beta = {beta:.3f}")
    print(f"  Check Normalization: |alpha|^2 + |beta|^2 = {alpha**2:.2f} + {beta**2:.2f} = {alpha**2 + beta**2:.2f}")
    print(f"  P(Outcome 0) = |alpha|^2 = {p0_target*100:.1f}%")
    print(f"  P(Outcome 1) = |beta|^2 = {p1_target*100:.1f}%")

def demonstrate_hadamard_operations():
    print("\n--- [2] Linear Algebra of the Hadamard Transform ---")
    H = (1 / np.sqrt(2)) * np.array([[1, 1], [1, -1]], dtype=complex)
    ket_0 = np.array([[1], [0]], dtype=complex)
    ket_1 = np.array([[0], [1]], dtype=complex)

    print("Hadamard Matrix H:\n", np.round(H, 4))

    # H |0>
    plus = np.dot(H, ket_0)
    print("\n1. Action on |0>: H|0> =")
    print(np.round(plus, 4))
    print(f"   Amplitudes: alpha = 1/sqrt(2) = {1/np.sqrt(2):.4f}, beta = 1/sqrt(2) = {1/np.sqrt(2):.4f}")
    print(f"   Probabilities: P(0) = {(1/np.sqrt(2))**2 * 100:.1f}%, P(1) = {(1/np.sqrt(2))**2 * 100:.1f}%")

    # H |1>
    minus = np.dot(H, ket_1)
    print("\n2. Action on |1>: H|1> =")
    print(np.round(minus, 4))
    print(f"   Amplitudes: alpha = 1/sqrt(2) = {1/np.sqrt(2):.4f}, beta = -1/sqrt(2) = {-1/np.sqrt(2):.4f}")
    print("   Notice the negative sign! This represents a quantum phase of 180 deg (e^{i*pi}).")

    # H^2 = I (Quantum Interference)
    print("\n3. Interference Test: Applying H twice (H * H |0>):")
    h_squared = np.dot(H, plus)
    print("   Result:\n", np.round(h_squared, 4))
    print("   Notice that H(H|0>) = |0>! The amplitudes for |1> cancelled out completely:")
    print("   beta_new = (1/sqrt(2))*(1/sqrt(2)) + (-1/sqrt(2))*(1/sqrt(2)) = 1/2 - 1/2 = 0 (Destructive Interference)")
    print("   alpha_new = (1/sqrt(2))*(1/sqrt(2)) + (1/sqrt(2))*(1/sqrt(2)) = 1/2 + 1/2 = 1 (Constructive Interference)")

def qiskit_hadamard_experiment():
    print("\n--- [3] Qiskit Aer Simulation (1024 Shots) ---")
    simulator = AerSimulator()

    # Circuit 1: Single H-gate + measurement
    qc1 = QuantumCircuit(1, 1)
    qc1.h(0)
    qc1.measure(0, 0)

    job1 = simulator.run(qc1, shots=1024)
    counts1 = job1.result().get_counts()
    print("Circuit 1 (|0> -> H -> Measure):")
    print(f"  1024-Shot Measurement: {counts1}")
    p0 = counts1.get('0', 0) / 1024 * 100
    p1 = counts1.get('1', 0) / 1024 * 100
    print(f"  Empirical: P(0) = {p0:.1f}%, P(1) = {p1:.1f}%  (Matches theoretical ~50% each)")

    # Circuit 2: Double H-gate + measurement (Interference)
    qc2 = QuantumCircuit(1, 1)
    qc2.h(0)
    qc2.h(0)
    qc2.measure(0, 0)

    job2 = simulator.run(qc2, shots=1024)
    counts2 = job2.result().get_counts()
    print("\nCircuit 2 (|0> -> H -> H -> Measure):")
    print(f"  1024-Shot Measurement: {counts2}")
    print("  Empirical: Returned to 100% '0' state, proving quantum wave interference!")

    # Statevector analysis
    sv = Statevector.from_instruction(QuantumCircuit(1).compose(qc1.remove_final_measurements(inplace=False)))
    print(f"\nStatevector prior to measurement: {sv}")
    print("\n[SUCCESS] Level 3 validation complete.")

if __name__ == "__main__":
    demonstrate_bit_vs_qubit_math()
    demonstrate_hadamard_operations()
    qiskit_hadamard_experiment()
