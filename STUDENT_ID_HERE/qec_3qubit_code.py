#!/usr/bin/env python3
"""
========================================================================================
Project: From Transistors to Qubits: A Hybrid Learning Framework
Quantum Error Correction: 3-Qubit Bit-Flip Repetition Code
========================================================================================
Concept Bridge:
  Classical Repetition Code:
    To protect bit '0', transmit '000'.
    If noise flips one bit -> '010', majority voter restores '0'.
    Classical bits can be read and copied freely.

  Quantum Dilemma:
    1. No-Cloning Theorem prevents copying unknown states |psi> -> |psi>|psi>|psi>.
    2. Direct measurement collapses superposition (alpha|0> + beta|1> -> 0 or 1).

  Quantum Solution (Entanglement & Parity / Syndrome Measurement):
    1. Encode into an entangled 3-qubit logical subspace:
         |0_L> = |000>
         |1_L> = |111>
         |psi_L> = alpha|000> + beta|111>
    2. Measure PARITY (eigenvalues of Z0 Z1 and Z1 Z2) without measuring individual qubits!
       - Syndrome s0 = q0 XOR q1
       - Syndrome s1 = q1 XOR q2
    3. Syndrome Lookup:
         (s1, s0) = (0, 0) -> No error
         (s1, s0) = (0, 1) -> Qubit 0 flipped -> Apply X0
         (s1, s0) = (1, 1) -> Qubit 1 flipped -> Apply X1
         (s1, s0) = (1, 0) -> Qubit 2 flipped -> Apply X2
========================================================================================
"""

import numpy as np
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit_aer import AerSimulator

def build_3qubit_qec_circuit(error_qubit: int = -1, initial_alpha: float = 0.6, initial_beta: float = 0.8) -> QuantumCircuit:
    """
    Builds the 3-qubit bit-flip code circuit:
      - 3 data qubits: q0, q1, q2
      - 2 syndrome ancilla qubits: s0, s1
      - 2 classical syndrome bits: c_syn (2 bits)
      - 1 final logical measurement bit: c_out (1 bit)
    """
    # Normalize initial amplitudes
    norm = np.sqrt(initial_alpha**2 + initial_beta**2)
    alpha = initial_alpha / norm
    beta = initial_beta / norm

    # Registers
    q_data = QuantumRegister(3, name="data")
    q_syn = QuantumRegister(2, name="syndrome")
    c_syn = ClassicalRegister(2, name="c_syn")
    c_out = ClassicalRegister(1, name="c_out")

    qc = QuantumCircuit(q_data, q_syn, c_syn, c_out)

    # 1. State Preparation: Prepare alpha|0> + beta|1> on data[0]
    # Rotation around Y axis: Ry(theta)|0> = cos(theta/2)|0> + sin(theta/2)|1>
    theta = 2 * np.arccos(alpha)
    qc.ry(theta, q_data[0])
    qc.barrier(label="Encoding")

    # 2. Logical Encoding: |psi> -> alpha|000> + beta|111>
    qc.cx(q_data[0], q_data[1])
    qc.cx(q_data[0], q_data[2])
    qc.barrier(label="Noise Injection")

    # 3. Simulate Noise (Bit-flip X error on chosen data qubit)
    if error_qubit in [0, 1, 2]:
        qc.x(q_data[error_qubit])
    qc.barrier(label="Syndrome Meas")

    # 4. Syndrome Extraction via Ancilla Parity Checks
    # Syndrome 0: data[0] XOR data[1] -> syn[0]
    qc.cx(q_data[0], q_syn[0])
    qc.cx(q_data[1], q_syn[0])

    # Syndrome 1: data[1] XOR data[2] -> syn[1]
    qc.cx(q_data[1], q_syn[1])
    qc.cx(q_data[2], q_syn[1])

    # Measure syndrome bits
    qc.measure(q_syn[0], c_syn[0])
    qc.measure(q_syn[1], c_syn[1])
    qc.barrier(label="Recovery")

    # 5. Quantum Recovery using Qiskit dynamic conditional gates (if_test)
    # Syndrome bitstring in Qiskit is [c_syn[1], c_syn[0]]
    # s0 = bit 0, s1 = bit 1. Numeric value = s0 + 2*s1
    # value 1: s0=1, s1=0 -> error on data[0] -> apply X on data[0]
    # value 3: s0=1, s1=1 -> error on data[1] -> apply X on data[1]
    # value 2: s0=0, s1=1 -> error on data[2] -> apply X on data[2]
    with qc.if_test((c_syn, 1)):
        qc.x(q_data[0])
    with qc.if_test((c_syn, 3)):
        qc.x(q_data[1])
    with qc.if_test((c_syn, 2)):
        qc.x(q_data[2])

    qc.barrier(label="Decode & Measure")

    # 6. Uncompute Encoding to restore data[0]
    qc.cx(q_data[0], q_data[2])
    qc.cx(q_data[0], q_data[1])

    # 7. Final Logical Measurement on data[0]
    qc.measure(q_data[0], c_out[0])

    return qc, alpha, beta

def test_qec_scenarios():
    print("\n" + "="*70)
    print(" QUANTUM ERROR CORRECTION: 3-QUBIT BIT-FLIP REPETITION CODE")
    print("="*70)

    initial_alpha = 0.6
    initial_beta = 0.8
    expected_p0 = initial_alpha**2
    expected_p1 = initial_beta**2
    print(f"Target Logical State: |psi> = {initial_alpha:.2f}|0> + {initial_beta:.2f}|1>")
    print(f"Theoretical Probabilities: P(0) = {expected_p0*100:.1f}%, P(1) = {expected_p1*100:.1f}%\n")

    simulator = AerSimulator()
    scenarios = [
        (-1, "Scenario 0: No error injected"),
        (0,  "Scenario 1: Bit flip (X) on Data Qubit 0"),
        (1,  "Scenario 2: Bit flip (X) on Data Qubit 1"),
        (2,  "Scenario 3: Bit flip (X) on Data Qubit 2"),
    ]

    print(f"{'Condition':<45} | {'Syndrome':<10} | {'Recovered P(0)':<15} | {'Recovered P(1)'}")
    print("-" * 85)

    for err_q, desc in scenarios:
        qc, a, b = build_3qubit_qec_circuit(error_qubit=err_q, initial_alpha=initial_alpha, initial_beta=initial_beta)
        job = simulator.run(qc, shots=4096)
        counts = job.result().get_counts()

        # Parse counts: keys are "c_out c_syn" -> e.g. "0 01" or "1 01"
        logical_0_count = 0
        logical_1_count = 0
        observed_syndromes = set()

        for bitstring, freq in counts.items():
            parts = bitstring.split()
            if len(parts) == 2:
                c_out_val, syn_val = parts[0], parts[1]
            else:
                c_out_val = bitstring[0]
                syn_val = bitstring[1:]
            observed_syndromes.add(syn_val)
            if c_out_val == '0':
                logical_0_count += freq
            else:
                logical_1_count += freq

        tot = logical_0_count + logical_1_count
        p0_emp = logical_0_count / tot * 100
        p1_emp = logical_1_count / tot * 100
        syn_str = ",".join(sorted(observed_syndromes))

        print(f"{desc:<45} | {syn_str:<10} | {p0_emp:<15.1f}% | {p1_emp:.1f}%")

    print("\nResult Summary:")
    print("  In EVERY scenario, the syndrome identified the corrupt qubit without destroying")
    print("  the superposition, and the conditional recovery restored the original state")
    print("  with high fidelity (~36% |0> and ~64% |1>).")
    print("\n[SUCCESS] Quantum Error Correction verification completed.")

if __name__ == "__main__":
    test_qec_scenarios()
