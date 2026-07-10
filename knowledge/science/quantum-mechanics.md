# Quantum Mechanics

Fundamental principles, phenomena, and formalism of quantum physics.

## Core Principles
- **Wave-particle duality**: Particles (electrons, photons) exhibit both particle-like and wave-like behavior. Double-slit experiment: electrons fired one at a time create interference pattern (wave behavior), but detectors at slits show particle impacts (collapse of wavefunction)
- **Quantization**: Energy, angular momentum, and other properties exist in discrete values (quanta). Planck: E = hf. Bohr atom: electrons only in specific orbitals
- **Superposition**: System exists in all possible states simultaneously until measured. Schrödinger's cat: alive AND dead until observation. The state is a linear combination of basis states
- **Uncertainty principle (Heisenberg)**: Cannot simultaneously know both position and momentum with arbitrary precision. Δx·Δp ≥ ħ/2. More precisely you measure position, less precisely you know momentum
- **Wavefunction collapse**: Upon measurement, superposition collapses to a single eigenstate. Measurement problem: how/why collapse occurs is debated (Copenhagen vs Many-Worlds vs Bohmian)

## Mathematical Formalism
- **Wavefunction (Ψ)**: Complex-valued function describing quantum state. |Ψ|² = probability density of finding particle at given position. Must be square-integrable (normalizable)
- **Schrödinger equation**: iħ ∂Ψ/∂t = ĤΨ — time-dependent equation governing evolution of wavefunction. Time-independent: ĤΨ = EΨ (eigenvalue equation for energy states)
- **Hilbert space**: Infinite-dimensional vector space where quantum states live. States are vectors: |ψ⟩ in Dirac bra-ket notation. Inner product ⟨φ|ψ⟩ gives overlap between states
- **Operators**: Represent observables (position x̂, momentum p̂ = -iħ∂/∂x, energy Ĥ). Eigenvalue equation: Â|ψ⟩ = a|ψ⟩ (a = measured value)
- **Dirac notation**: |ψ⟩ = ket (state vector), ⟨ψ| = bra (dual vector = complex conjugate transpose). ⟨φ|ψ⟩ = inner product. |ψ⟩⟨ψ| = projection operator

## Key Phenomena
- **Quantum tunneling**: Particle passes through potential barrier even when classical energy insufficient. Tunneling probability depends on barrier height/width, particle mass. Applications: scanning tunneling microscope (STM), flash memory, nuclear fusion in stars
- **Quantum entanglement**: Particles become correlated such that measuring one instantly determines the state of the other, regardless of distance. "Spooky action at a distance" (Einstein). Bell's theorem: local hidden variable theories cannot reproduce all quantum predictions. Bell test experiments confirm entanglement is real
- **Quantum decoherence**: Interaction with environment causes loss of quantum coherence — superposition decays into classical mixture. Explains why macroscopic objects don't show quantum effects. Main obstacle for quantum computing
- **Zero-point energy**: Even at absolute zero, quantum systems have minimum energy (ground state). ½ħω per harmonic oscillator mode. Casimir effect: attraction between uncharged conducting plates from vacuum fluctuations
- **Spin**: Intrinsic angular momentum of particles. Half-integer spin (fermions — electrons, protons, neutrons) vs integer spin (bosons — photons, gluons). Spin-½: two states (up ↑, down ↓). Pauli exclusion principle: no two fermions in same quantum state

## Interpretations
- **Copenhagen**: Wavefunction describes knowledge, not reality. Collapse occurs upon measurement. Most widely taught, pragmatic for calculations
- **Many-Worlds (Everett)**: All possibilities happen, branching into parallel universes. No collapse — observer becomes entangled with system. Wavefunction of universe evolves unitarily. Most economical (no collapse mechanism needed) but ontologically extravagant
- **Pilot wave (de Broglie-Bohm)**: Particles have definite positions guided by pilot wave (quantum potential). Non-local, deterministic. Hidden variables restored. Reproduces all quantum predictions
- **QBism**: Quantum mechanics is a tool for agents to make decisions — probabilities are subjective degrees of belief. Collapse = updating beliefs based on experience
- **Objective collapse (GRW, Penrose)**: Wavefunction spontaneously collapses after certain time/mass threshold — modifies Schrödinger equation

## Quantum Computing
- **Qubit**: Quantum bit — superposition of |0⟩ and |1⟩. Represented as α|0⟩ + β|1⟩, where |α|² + |β|² = 1
- **Quantum gates**: Unitary operations on qubits — Hadamard (create superposition), CNOT (entangle), Pauli X/Y/Z (flip), phase shift. Reversible (unlike classical NAND)
- **Quantum algorithms**: Shor (factor large numbers — breaks RSA encryption), Grover (search unsorted database — quadratic speedup), Simon (oracle problems)
- **Quantum supremacy**: Demonstrating quantum computer solving problem impossible for classical computers. Google Sycamore (2019): 53 qubits, 200 seconds vs 10,000 years classical estimate
- **Challenges**: Decoherence, error correction (need ~1000 physical qubits per logical qubit), qubit connectivity

## Applications
- **Lasers**: Stimulated emission — population inversion produces coherent light
- **Transistors**: Semiconductor physics — band structure, doping, quantum tunneling in flash memory
- **MRI**: Nuclear magnetic resonance — spin alignment and precession in magnetic field
- **Quantum cryptography**: BB84 protocol for secure key distribution — eavesdropping detectable from disturbance
- **Atomic clocks**: Most precise timekeeping — cesium-133 hyperfine transition defines the second
