# Physical Chemistry & Materials Science

## Thermodynamics (Advanced)

### Laws of Thermodynamics
- **Zeroth**: if A = B in thermal equilibrium and B = C, then A = C (temperature exists = measurable). Basis for thermometry
- **First**: energy conserved: ΔU = Q - W (change in internal energy = heat added minus work done). In a cyclic process, ΔU = 0, Q = W. No perpetual motion machine (Type 1)
- **Second**: entropy (S) never decreases in isolated system (ΔS_total ≥ 0). Heat cannot spontaneously flow from cold → hot without external work. Entropy = measure of disorder/ number of possible microstates: S = k ln Ω (Boltzmann's equation). The "arrow of time" — why time goes forward (entropy always increases). Type 2 perpetual motion impossible
- **Third**: absolute zero (0 K, -273.15°C) unattainable in finite steps. At T=0, perfect crystal has entropy = 0 (one ground state). As T→0, ΔS→0
- **Zeroth law is fundamental**: establishes concept of temperature

### State Functions vs Path Functions
- **State functions**: depend only on current state (P, V, T, U, H, S, G). Independent of path. ΔU depends only on initial + final state, not how change happened
- **Path functions**: depend on HOW change occurred (Q, W). Work + heat are process-specific. ΔU = Q + W (Q and W depend on path, but sum doesn't in closed system)

### Enthalpy, Entropy, Gibbs Free Energy
- **Enthalpy (H)**: H = U + PV. Heat content at constant pressure (ΔH = heat flow at constant P). Endothermic (+ΔH, absorbs heat), exothermic (-ΔH, releases heat). Bond energy: breaking requires energy (endothermic), forming releases energy (exothermic)
- **Gibbs free energy (G)**: G = H - TS. Spontaneity: ΔG < 0 = spontaneous. ΔG = ΔH - TΔS. At equilibrium: ΔG = 0. Reaction direction driven by enthalpy (ΔH) + entropy (ΔS) + temperature. High temp favors entropy-driven reactions (TΔS dominates)
- **Entropy (S)**: gas > liquid > solid (more disorder). Dissolving increases entropy. Temperature increase = entropy increase. Reactions with gas production usually increase entropy. Mixing increases entropy. Spontaneous endothermic reactions: driven by entropy increase (ΔS positive compensates for ΔH positive)

### Reaction Kinetics
- **Rate law**: rate = k[A]^m[B]^n (k = rate constant, m,n = reaction orders, not necessarily coefficients in balanced equation). Order determined experimentally, not from stoichiometry. Zero order: rate independent of concentration. First order: rate ∝ [A]. Second order: rate ∝ [A]² or [A][B]
- **Arrhenius equation**: k = A exp(-Ea/RT). Rate constant k increases exponentially with temperature. Activation energy (Ea): minimum energy needed for reaction. Lower Ea = faster reaction (catalyst lowers Ea). The higher Ea, the more temperature-sensitive the reaction rate
- **Catalysis**: catalyst provides alternative pathway with lower Ea, does not affect ΔG or equilibrium. Homogeneous (same phase, e.g. enzyme in solution) vs heterogeneous (different phase, e.g. solid catalyst + gas reactants). Enzyme: biological catalyst — lock+key fit (specific shape for substrate) vs induced fit (conformational change upon substrate binding)
  - Transition state theory: the reaction passes through high-energy transition state (unstable intermediate at the saddle point on the potential energy surface). Catalyst stabilizes transition state = lowers Ea. Most catalysts highly selective

## Materials Science

### Crystal Structures
- **Unit cells**: simple cubic (rare, Po). BCC (body-centered cubic: Fe, W, Cr, Mo. 2 atoms per cell). FCC (face-centered cubic: Al, Cu, Au, Pt, Ag. 4 atoms per cell — close-packed, dense). HCP (hexagonal close-packed: Mg, Ti, Zn, Co. 6 atoms per cell). Diamond cubic (Si, Ge, diamond — 8 atoms per cell, tetrahedral bonds, important for semiconductors). Coordination number (CN): number of nearest neighbors. Packing efficiency: BCC 68%, FCC 74%, HCP 74% (FCC and HCP are the same packing fraction but layer stacking different: ABCABC vs ABAB)
- **Crystal defects**: point (vacancy, interstitial, substitutional). Linear (dislocation — edge dislocation: extra half-plane of atoms; screw dislocation: spiral around dislocation line). Planar (grain boundaries, twin boundaries). Volume (voids, inclusions). Defects determine mechanical properties (dislocations enable plastic deformation)
  - Dislocations: edge + screw dislocation motion under stress = plastic deformation. Without dislocations: crystals would be extremely brittle (theoretical strength 100x higher than real). Work hardening: deforming metal increases dislocation density = stronger but more brittle

### Phase Diagrams
- **Binary phase diagram**: temperature vs composition (at constant pressure). Solidus (below = completely solid), liquidus (above = completely liquid). Eutectic: specific composition where liquid → two solid phases at lower temp than either pure component. Eutectoid: solid → two different solid phases on cooling (steel: austenite → ferrite + cementite at 0.77% C, 727°C). Peritectic: liquid + solid → one solid phase on cooling
- **Lever rule**: determines proportion of each phase at given temperature + composition. In a two-phase region: draw horizontal tie line to phase boundaries. Opposite segment/ tie-line length = fraction of other phase
- **Alloying**: adding elements to improve properties. Steel: Fe + C (0.1-2% C). Carbon increases strength + hardness, decreases ductility. Heat treatment: annealing (heat, slow cool → soft, relieve stress, coarsen grains). Quenching (rapid cool → hard, martensite — very hard + brittle). Tempering (reheat to 300-600°C → reduce brittleness, increase toughness). Stainless steel: add Cr (>10.5%) + Ni — forms passive Cr₂O₃ layer, corrosion resistant

### Polymers
- **Types**: thermoplastics (melt when heated, reversible — polyethylene, PVC, nylon, PET). Thermosets (permanent cross-links, can't remelt — epoxy, bakelite, rubber, silicone). Elastomers (rubber, stretchy, cross-linked — natural rubber, neoprene, silicone, Viton)
- **Polymerization**: addition (radical chain reaction: add monomers one at a time — polyethylene, polypropylene, PS, PMMA). Condensation (eliminate small molecule — H₂O, HCl — nylon, polyester, PET). Molecular weight affects properties (e.g. tensile strength, viscosity). Degree of polymerization (DP) = number of monomers per chain

### Composite Materials
- **Fiber-reinforced**: glass fiber + epoxy (fiberglass — cheap, strong, low stiffness). Carbon fiber + epoxy (light, strong, stiff, expensive — aerospace, sports equipment, luxury cars). Aramid (Kevlar — high tensile strength, impact resistance, used in bulletproof vests). Wood: natural composite (cellulose fibers + lignin matrix). Bone: collagen fibers + hydroxyapatite mineral matrix
  - Rule of mixtures: composite property = V_f × E_f + (1 - V_f) × E_m (where V_f = fiber volume fraction). Parallel: modulus = weighted average. Perpendicular: modulus = (V_f/E_f + V_m/E_m)^{-1}. This explains why fibers aligned in direction of stress are most efficient
- **Ceramic matrix**: SiC fiber in Al₂O₃ matrix. High temperature, high strength, for jet turbines
- **Metal matrix**: Al/B, Ti/SiC — for aerospace (high specific stiffness). Typically for thermal management + structural applications

### Mechanical Properties
- **Stress-strain curve**: elastic region (linear, reversible, slope = Young's modulus E). Yield point (onset of permanent deformation). Plastic region (permanent deformation, work hardening). Ultimate tensile strength (UTS, max stress). Fracture (break)
  - Young's modulus (E): stiffness, resistance to elastic deformation. Diamond: 1,200 GPa. Steel: 200 GPa. Al: 70 GPa. Bone: 10-30 GPa. Wood: 5-15 GPa. Polymers: 0.1-5 GPa. Modulus = bonding strength
  - Ductility: % elongation before fracture (gold >40%, copper 30%, steel 15-30%, aluminum 10-20%, cast iron <1% — brittle). Toughness: area under stress-strain curve (energy absorbed before fracture). Strength ≠ toughness: ceramics are strong but not tough (little plastic deformation)
- **Fatigue**: failure under cyclic loading at stress < yield strength. S-N curve: stress vs cycles to failure. Endurance limit: stress below which material can cycle infinitely (steel, Ti). Aluminum has no endurance limit — eventually fail under any cyclic load. Fatigue causes ~90% of all metal mechanical failures
- **Creep**: time-dependent deformation under constant stress at high temperature (>0.3-0.5 Tm, where Tm = melting temp). Important for: turbine blades, nuclear reactors, engine components. Creep-resistant alloys: nickel superalloys (e.g., Inconel 718) for turbine blades
