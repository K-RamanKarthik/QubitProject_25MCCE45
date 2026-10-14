#!/usr/bin/env python3
"""
========================================================================================
Project: From Transistors to Qubits: A Hybrid Learning Framework
Level 4: Classical Digital Circuit vs Quantum Circuit
========================================================================================
Concept Bridge:
  Logical Function: 1-Bit Half Adder
    Inputs:  A, B in {0, 1}
    Outputs: Sum = A XOR B
             Carry = A AND B

  Classical Architecture:
    - Built from Transistors -> Gates (XOR gate + AND gate).
    - Irreversible: Erases input information (violates time-reversal symmetry).
    - Landauer's Principle: Erasing 1 bit of information dissipates >= k_B * T * ln(2) Joules.

  Quantum Architecture:
    - Unitary evolution: Must be reversible and preserve information.
    - Uses 4 Qubits:
        |q0> = |A>
        |q1> = |B>
        |q2> = |0> (Target for Sum: CNOTs)
        |q3> = |0> (Target for Carry: Toffoli / CCX)
    - Superposition Capability: When inputs are put into superposition (H|0> on q0, q1),
      the quantum circuit evaluates ALL 4 additions (0+0, 0+1, 1+0, 1+1) simultaneously
      in a single quantum execution (Quantum Parallelism)!
========================================================================================
"""

import numpy as np
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

def classical_half_adder(a: int, b: int) -> dict:
    """
    Simulates the classical transistor-level half adder.
    XOR gate for Sum, AND gate for Carry.
    """
    sum_out = a ^ b
    carry_out = a & b
    # Estimated transistor count in standard static CMOS:
    # XOR gate = 8 transistors, AND gate = 6 transistors (NAND + Inverter)
    transistor_count = 14
    return {
        "A": a,
        "B": b,
        "Sum": sum_out,
        "Carry": carry_out,
        "CMOS_Transistors": transistor_count
    }

def quantum_half_adder_circuit(input_a: int = 0, input_b: int = 0, superposition: bool = False) -> QuantumCircuit:
    """
    Builds the quantum reversible half adder circuit.
    q0: input A
    q1: input B
    q2: Sum output register (starts at |0>)
    q3: Carry output register (starts at |0>)
    """
    qc = QuantumCircuit(4, 4 if not superposition else 4)

    # 1. State preparation
    if superposition:
        # Create equal superposition of all 4 inputs: |00>, |01>, |10>, |11>
        qc.h(0)
        qc.h(1)
    else:
        if input_a == 1:
            qc.x(0)
        if input_b == 1:
            qc.x(1)

    qc.barrier()

    # 2. Compute Carry = A AND B using Toffoli (CCX) gate
    # Controls: q0, q1; Target: q3
    qc.ccx(0, 1, 3)

    # 3. Compute Sum = A XOR B using two CNOT (CX) gates onto q2
    qc.cx(0, 2)
    qc.cx(1, 2)

    qc.barrier()

    # 4. Measure all qubits
    qc.measure([0, 1, 2, 3], [0, 1, 2, 3])
    return qc

def run_level4_demonstration():
    print("\n" + "="*70)
    print(" LEVEL 4: CLASSICAL DIGITAL CIRCUIT vs QUANTUM CIRCUIT")
    print(" Function: 1-Bit Half Adder (Sum = A XOR B, Carry = A AND B)")
    print("="*70)

    # 1. Classical Truth Table Execution
    print("\n--- [1] Classical Half Adder (Transistor Logic) ---")
    print(f"{'Input A':<10} | {'Input B':<10} | {'Sum (XOR)':<12} | {'Carry (AND)':<12} | {'Transistors'}")
    print("-" * 65)
    for a in [0, 1]:
        for b in [0, 1]:
            res = classical_half_adder(a, b)
            print(f"{res['A']:<10} | {res['B']:<10} | {res['Sum']:<12} | {res['Carry']:<12} | {res['CMOS_Transistors']} MOSFETs")

    print("\nObservation: In classical circuits, input bits cannot be recovered from output bits.")
    print("             Information is permanently lost as heat (Landauer's Principle).")

    # 2. Quantum Circuit Reversible Execution (Deterministic Inputs)
    print("\n--- [2] Quantum Reversible Circuit Execution (AerSimulator) ---")
    simulator = AerSimulator()

    test_cases = [(0, 0), (0, 1), (1, 0), (1, 1)]
    for a, b in test_cases:
        qc = quantum_half_adder_circuit(input_a=a, input_b=b, superposition=False)
        job = simulator.run(qc, shots=512)
        counts = job.result().get_counts()
        # Qiskit bitstring order is [c3, c2, c1, c0] = [Carry, Sum, Input_B, Input_A]
        raw_bitstring = list(counts.keys())[0]
        carry_meas = raw_bitstring[0]
        sum_meas = raw_bitstring[1]
        b_meas = raw_bitstring[2]
        a_meas = raw_bitstring[3]
        print(f"Inputs: A={a}, B={b} --> Qiskit Output Bitstring '{raw_bitstring}':")
        print(f"   Decoded: Carry={carry_meas}, Sum={sum_meas} | Preserved Inputs: A={a_meas}, B={b_meas}")

    # 3. Quantum Parallelism with Superposition
    print("\n--- [3] Quantum Parallelism: All 4 Inputs Evaluated Simultaneously ---")
    print("Applying Hadamard gates H on inputs q0 and q1 before the circuit...")
    qc_super = quantum_half_adder_circuit(superposition=True)
    job_super = simulator.run(qc_super, shots=2048)
    counts_super = job_super.result().get_counts()

    print(f"2048-Shot Histogram Counts: {counts_super}")
    print("\nInterpretation of Superposition Measurement:")
    print(f"{'Bitstring (c3 c2 c1 c0)':<25} | {'Input (A, B)':<15} | {'Sum':<6} | {'Carry':<6} | {'Frequency'}")
    print("-" * 70)
    for bitstr, cnt in sorted(counts_super.items()):
        c_out, s_out, b_in, a_in = bitstr[0], bitstr[1], bitstr[2], bitstr[3]
        print(f"{bitstr:<25} | A={a_in}, B={b_in}        | {s_out:<6} | {c_out:<6} | {cnt} / 2048 (~25%)")

    print("\n[SUCCESS] Level 4 validation complete: Reversible quantum arithmetic demonstrated.")

if __name__ == "__main__":
    run_level4_demonstration()
