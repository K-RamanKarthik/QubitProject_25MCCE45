#!/usr/bin/env python3
"""
========================================================================================
Project: From Transistors to Qubits: A Hybrid Learning Framework
Master Test Runner: run_all.py
Executes all Python & Qiskit simulation modules and validates outputs.
========================================================================================
"""

import sys
import subprocess
import time
from pathlib import Path

SCRIPTS = [
    ("Level 2: Transistor NOT vs Pauli-X", "level2_not_vs_x.py"),
    ("Level 3: Bit to Qubit & Hadamard", "level3_hadamard.py"),
    ("Level 4: Classical vs Quantum Half Adder", "level4_circuits.py"),
    ("Noise Models: Classical Jitter vs Decoherence", "noise_models.py"),
    ("QEC: 3-Qubit Bit-Flip Repetition Code", "qec_3qubit_code.py")
]

def run_script(title: str, filename: str, script_dir: Path) -> bool:
    print("\n" + "#"*75)
    print(f" RUNNING: {title} ({filename})")
    print("#"*75)
    start_time = time.time()
    
    script_path = script_dir / filename
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        elapsed = time.time() - start_time
        print(f"--> [PASS] {filename} completed in {elapsed:.2f}s")
        return True
    except subprocess.CalledProcessError as e:
        print(e.stdout)
        print(e.stderr, file=sys.stderr)
        elapsed = time.time() - start_time
        print(f"--> [FAIL] {filename} failed with exit code {e.returncode} in {elapsed:.2f}s")
        return False

def main():
    script_dir = Path(__file__).resolve().parent
    print("="*75)
    print(" FROM TRANSISTORS TO QUBITS: MASTER VALIDATION SUITE")
    print(f" Python Interpreter: {sys.executable}")
    print(f" Working Directory:  {script_dir}")
    print("="*75)

    results = []
    for title, filename in SCRIPTS:
        success = run_script(title, filename, script_dir)
        results.append((title, filename, success))

    print("\n" + "="*75)
    print(" FINAL VERIFICATION SUMMARY")
    print("="*75)
    all_passed = True
    print(f"{'Module Title':<45} | {'Filename':<22} | {'Status'}")
    print("-" * 75)
    for title, filename, success in results:
        status_str = "PASS [OK]" if success else "FAIL [X]"
        if not success:
            all_passed = False
        print(f"{title:<45} | {filename:<22} | {status_str}")

    print("="*75)
    if all_passed:
        print(" ALL 5 QUANTUM & SEMICONDUCTOR SIMULATION MODULES PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print(" SOME MODULES FAILED. PLEASE CHECK LOGS ABOVE.")
        sys.exit(1)

if __name__ == "__main__":
    main()
