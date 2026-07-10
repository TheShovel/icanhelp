# Thermodynamics

Laws of thermodynamics, heat transfer, and thermodynamic principles.

## Key Concepts
- **System types**: Open (exchanges matter + energy with surroundings), Closed (exchanges energy only), Isolated (exchanges nothing — universe is isolated system)
- **State variables**: Temperature (T), Pressure (P), Volume (V), Internal energy (U), Entropy (S), Enthalpy (H = U + PV), Gibbs free energy (G = H - TS). Path functions: heat (Q), work (W) — depend on process path, not just initial/final state
- **Thermal equilibrium**: Zeroth Law — if A = B and B = C in temperature, then A = C. Enables thermometers. Basis for temperature measurement
- **Temperature scales**: Kelvin (absolute — 0K = -273.15°C), Celsius (°C), Fahrenheit (°F). 0K = absolute zero (theoretical minimum, unattainable — third law)

## The Laws
- **First Law (Conservation of Energy)**: ΔU = Q - W. Energy cannot be created or destroyed, only converted between forms. Internal energy change = heat added minus work done by system. Energy of universe is constant
- **Second Law (Entropy)**: ΔS_universe ≥ 0 — total entropy of an isolated system never decreases. Processes occur spontaneously in direction of increasing entropy. Heat flows from hot to cold spontaneously. Not a force — statistical probability: there are vastly more disordered arrangements than ordered ones
- **Third Law (Absolute Zero)**: As T → 0K, entropy of a perfect crystal approaches zero. Absolute zero cannot be reached in finite steps. Explains why we can approach but never reach 0K. Gives absolute entropy scale (S = 0 at 0K for perfect crystal)
- **Zeroth Law (Thermal Equilibrium)**: Objects in thermal equilibrium have same temperature. Provides basis for temperature measurement

## Thermodynamic Processes
- **Isothermal**: Constant temperature. ΔU = 0 for ideal gas (Q = W). Slow process — heat flows to maintain constant T. PV = constant (Boyle's Law)
- **Adiabatic**: No heat transfer (Q = 0). ΔU = -W. Fast process (piston compressed quickly, no time for heat exchange). PV^γ = constant. γ = Cp/Cv (ratio of specific heats, ~1.4 for diatomic gas). Temperature changes during compression/expansion
- **Isobaric**: Constant pressure. Work = PΔV. Enthalpy change ΔH = Q_p (heat at constant pressure). Cp > Cv (need extra energy for expansion work)
- **Isochoric (Isovolumetric)**: Constant volume. W = 0. ΔU = Q_v (heat at constant volume). Cv = dU/dT
- **Cyclic**: Returns to initial state. ΔU = 0 (state function). Q = W (net heat = net work). Heat engines, refrigerators

## Heat Transfer
- **Conduction**: Heat transfer through material without bulk movement. Fourier's Law: q = -k·A·dT/dx (k = thermal conductivity). Metals high k (free electrons), insulators low k (still air ~0.02 W/mK). Thermal resistance: R = L/k·A
- **Convection**: Heat transfer by fluid motion. Newton's Law of Cooling: q = h·A·(Ts - T∞). Natural convection (buoyancy driven), forced convection (fan/pump). h depends on fluid properties, flow velocity, geometry
- **Radiation**: Electromagnetic waves (infrared). Stefan-Boltzmann: q = ε·σ·A·(T₁⁴ - T₂⁴). σ = 5.67×10⁻⁸ W/m²K⁴. ε = emissivity (0-1, perfect blackbody = 1). No medium needed — heat from Sun through vacuum. Absorption, reflection, transmission

## Heat Engines
- **Carnot cycle**: Most efficient possible engine operating between two reservoirs. Four steps: isothermal expansion (Q_in at Th), adiabatic expansion (work out, cool), isothermal compression (Q_out at Tc), adiabatic compression (work in, heat up)
- **Efficiency**: η = 1 - Tc/Th (Carnot maximum). Always < 100% (would need Tc = 0K). Real engines: 30-40% typical (gasoline ~30%, diesel ~40%, combined cycle power plants ~60%)
- **Otto cycle (gasoline)**: Isochoric heat addition (spark ignition) + isochoric heat rejection. Compression ratio ~8-11. Higher compression = higher efficiency but knock limit
- **Diesel cycle**: Isobaric heat addition (compression ignition). Higher compression ratio ~15-22. Higher efficiency than Otto. No spark plug needed

## Refrigerators & Heat Pumps
- **Reverse Carnot cycle**: Work input moves heat from cold to hot. Coefficient of Performance (COP) = Q_c/W (refrigerator) or Q_h/W (heat pump). COP = Tc/(Th - Tc) for Carnot. Real devices: COP ~2-4
- **Vapor-compression cycle**: Working fluid evaporates at low pressure (absorbs heat from cold space) → compressor raises pressure/temperature → condenses at high pressure (releases heat to hot space) → expansion valve drops pressure → repeat. Refrigerant R-134a, R-410A, R-32
- **Heat pump**: Reversible — provide heating in winter (move heat from outside to inside), cooling in summer (move heat from inside to outside). Even in cold air, enough thermal energy exists (down to ~-20°C efficient, limit around -30°C for air source)

## Ideal Gas Law
- **PV = nRT**: P (pressure), V (volume), n (moles), R (universal gas constant = 8.314 J/mol·K), T (temperature in Kelvin). Also: PV = NkT (N = number of molecules, k = Boltzmann constant = 1.38×10⁻²³ J/K)
- **Kinetic theory**: Temperature = measure of average kinetic energy of molecules. KE_avg = (3/2)kT for monatomic gas. Pressure = collisions of molecules with walls. Average molecular speed ≈ √(3RT/M) (M = molar mass). Lighter molecules move faster
- **Real gases**: Deviations at high pressure and low temperature (intermolecular forces, finite molecular volume). Van der Waals equation: (P + a/V²)(V - b) = RT (a corrects for attraction, b for volume of molecules)

## Free Energy & Equilibrium
- **Gibbs free energy**: G = H - TS. ΔG < 0 = spontaneous process (at constant T, P). ΔG > 0 = non-spontaneous (needs energy input). ΔG = 0 = equilibrium
- **ΔG = ΔH - TΔS**: Process can be: driven by enthalpy (exothermic, ΔH < 0), driven by entropy (ΔS > 0), or both. Temperature can flip sign: dissolution of many solids (endothermic but spontaneous — entropy driven)
- **Chemical potential**: μ = molar Gibbs free energy. In equilibrium, chemical potential of each component is equal throughout system. Drives diffusion, phase changes, chemical reactions
- **Phase diagrams**: Show stable phase at given T and P. Triple point (coexistence of solid, liquid, gas — unique T,P for each substance). Critical point (above which liquid and gas indistinguishable). Water: triple point 0.01°C, 611 Pa; critical point 374°C, 22.1 MPa
