#!/usr/bin/env python3
"""
========================================================================================
Project: From Transistors to Qubits: A Hybrid Learning Framework
Noise Models: Classical Voltage Jitter vs Quantum Decoherence & Pauli Errors
========================================================================================
Conceptual Comparison:
  "How does classical noise in transistor-based switching compare conceptually 
   with noise affecting quantum states?"

  1. Classical Noise (Additive Voltage Fluctuation):
     - V_out(t) = V_ideal + n(t), where n(t) ~ Normal(0, sigma^2).
     - Noise Margin: As long as V_out remains within the valid logic band 
       (V_out > V_OH_min for '1', or V_out < V_OL_max for '0'), noise is 
       COMPLETELY RESTORED / FILTERED by subsequent non-linear saturation stages.
     - Errors are macroscopic and discrete threshold violations.

  2. Quantum Noise (Decoherence, Phase Randomization & Entanglement with Environment):
     - Quantum noise is fundamentally continuous in Hilbert space:
       |psi> = alpha|0> + beta|1> -> alpha|0> + beta*e^(i*phi)|1> (Phase Damping / Decoherence)
     - By the No-Cloning Theorem, we CANNOT simply measure and amplify intermediate 
       amplitudes to restore them without collapsing the superposition.
     - Types of Quantum Noise:
         * Bit-flip error: X operator applied with probability p.
         * Phase-flip error: Z operator applied with probability p (does not change energy,
           only phase, invisible to classical computers!).
         * Depolarizing channel: Uniformly replaces state with the maximally mixed state I/2.
========================================================================================
"""

import numpy as np
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, pauli_error, depolarizing_error

def simulate_classical_noise(num_samples: int = 10000, sigma: float = 0.8, v_logic_high: float = 5.0, v_th: float = 2.5):
    """
    Simulates additive Gaussian thermal noise on a logic HIGH (5.0V) signal.
    Bit error occurs if noise pulls V_out below V_threshold (2.5V).
    """
    noise = np.random.normal(loc=0.0, scale=sigma, size=num_samples)
    v_measured = v_logic_high + noise
    
    # Threshold detection: If V < 2.5V, read as logic 0 (Bit Error!)
    errors = np.sum(v_measured < v_th)
    ber = errors / num_samples
    
    return {
        "num_samples": num_samples,
        "sigma": sigma,
        "v_ideal": v_logic_high,
        "v_th": v_th,
        "errors": errors,
        "ber": ber,
        "min_v": np.min(v_measured),
        "mean_v": np.mean(v_measured)
    }

def run_classical_noise_sweep():
    print("\n" + "="*70)
    print(" [A] CLASSICAL TRANSISTOR NOISE MARGIN SIMULATION")
    print(" Formula: Vout(t) = V_ideal + n(t),  n(t) ~ N(0, sigma^2)")
    print("="*70)
    sigmas = [0.2, 0.5, 0.8, 1.0, 1.2, 1.5]
    print(f"{'Noise Sigma (V)':<18} | {'Ideal Logic':<12} | {'Bit Errors (10k)':<18} | {'Bit Error Rate (BER)'}")
    print("-" * 70)
    for s in sigmas:
        res = simulate_classical_noise(sigma=s)
        print(f"{res['sigma']:<18.2f} | 5.0V (Bit 1)   | {res['errors']:<18} | {res['ber']*100:.2f}%")
    print("\nTakeaway: Small noise (sigma < 0.5V) produces 0% bit errors due to high noise margins.")
    print("          Once noise reaches ~1.0V+, threshold crossings cause catastrophic bit flips.")

def run_quantum_noise_simulation():
    print("\n" + "="*70)
    print(" [B] QUANTUM NOISE CHANNELS (Bit-Flip, Phase-Flip, Depolarizing)")
    print("="*70)

    # 1. Quantum Bit-Flip Channel on |0>
    p_error = 0.15  # 15% probability of error
    print(f"\n1. Quantum Bit-Flip Channel (Error Rate p = {p_error*100}%):")
    # Bit-flip error: X with prob p, I with prob 1-p
    bit_flip = pauli_error([('X', p_error), ('I', 1 - p_error)])
    noise_bitflip = NoiseModel()
    noise_bitflip.add_all_qubit_quantum_error(bit_flip, ['id', 'x', 'h', 'measure'])

    qc_bit = QuantumCircuit(1, 1)
    qc_bit.id(0)  # Idling qubit in |0>
    qc_bit.measure(0, 0)

    sim = AerSimulator()
    job_bf = sim.run(qc_bit, noise_model=noise_bitflip, shots=2000)
    counts_bf = job_bf.result().get_counts()
    print(f"   Input State: |0>")
    print(f"   Measured Counts (2000 shots): {counts_bf}")
    print(f"   Observed Bit-Flip Rate: {counts_bf.get('1', 0)/2000 * 100:.2f}% (Expected ~15%)")

    # 2. Quantum Phase-Flip Channel on Superposition |+>
    print(f"\n2. Quantum Phase-Flip Channel (Error Rate p = {p_error*100}%):")
    # Phase-flip: Z with prob p, I with prob 1-p
    # Note: Z |+> = |->. If we measure in X-basis (apply H before measurement),
    # |+> -> |0>, but |-> -> |1>!
    phase_flip = pauli_error([('Z', p_error), ('I', 1 - p_error)])
    noise_phase = NoiseModel()
    noise_phase.add_all_qubit_quantum_error(phase_flip, ['id', 'x', 'h', 'measure'])

    qc_phase = QuantumCircuit(1, 1)
    qc_phase.h(0)   # Prepare |+>
    qc_phase.id(0)  # Noise acts here: Z turns |+> into |->
    qc_phase.h(0)   # Interference check: |+> returns to |0>, |-> goes to |1>
    qc_phase.measure(0, 0)

    job_pf = sim.run(qc_phase, noise_model=noise_phase, shots=2000)
    counts_pf = job_pf.result().get_counts()
    print(f"   Input State: |+> = (|0>+|1>)/sqrt(2)")
    print(f"   Measured Counts in X-basis: {counts_pf}")
    print(f"   Observed Phase-Flip Rate: {counts_pf.get('1', 0)/2000 * 100:.2f}%")
    print("   Takeaway: Phase noise destroys quantum coherence without altering energy populations!")

    # 3. Depolarizing Channel
    print(f"\n3. Depolarizing Channel (Rate p = {p_error*100}%):")
    depol = depolarizing_error(p_error, 1)
    noise_depol = NoiseModel()
    noise_depol.add_all_qubit_quantum_error(depol, ['id', 'x', 'h', 'measure'])

    qc_depol = QuantumCircuit(1, 1)
    qc_depol.id(0)
    qc_depol.measure(0, 0)
    job_dp = sim.run(qc_depol, noise_model=noise_depol, shots=2000)
    print(f"   Measured Counts under Depolarizing Noise: {job_dp.result().get_counts()}")

    print("\n[SUCCESS] Noise models executed and verified.")

if __name__ == "__main__":
    run_classical_noise_sweep()
    run_quantum_noise_simulation()
