# Optics

Light behavior — reflection, refraction, lenses, and optical instruments.

## Light Properties
- **Wave-particle duality**: Light behaves as wave (interference, diffraction) and particle (photoelectric effect). Electromagnetic wave: oscillating electric (E) and magnetic (B) fields perpendicular to each other and propagation direction
- **Speed of light**: c = 299,792,458 m/s in vacuum. Slows in medium: v = c/n (n = refractive index). Air n ≈ 1.0003, Water n ≈ 1.33, Glass n ≈ 1.5-1.9, Diamond n ≈ 2.42
- **Electromagnetic spectrum**: Radio (λ > 1mm) → Microwave (1mm-1μm) → Infrared (700nm-1mm) → Visible (400-700nm) → Ultraviolet (10-400nm) → X-ray (0.01-10nm) → Gamma (<0.01nm). Human eyes sensitive to ~400-700nm (violet to red)
- **Color perception**: Objects reflect specific wavelengths — red apple reflects ~650nm, absorbs others. Color temperature: warm (2700K — incandescent) to cool (6500K — daylight). Visible spectrum: ROYGBIV (Red 700nm, Orange 610, Yellow 580, Green 550, Blue 470, Indigo 450, Violet 400)

## Reflection
- **Law of reflection**: θᵢ = θᵣ (angle of incidence = angle of reflection). Incident ray, reflected ray, and normal all in same plane. Applies to smooth (specular) surfaces — mirrors, calm water
- **Specular vs diffuse**: Specular (smooth surface — mirror, polished metal) — rays reflect in same direction, clear image. Diffuse (rough surface — paper, wall, matte paint) — rays scatter in all directions, no image but can see surface from any angle. Most objects are diffuse reflectors
- **Mirror types**: Plane (flat — image same size, virtual, laterally inverted). Concave (converging — focus parallel rays to point. Real/inverted/magnified inside focal length. Used: telescope, makeup mirror, headlamp). Convex (diverging — spread rays. Virtual/upright/reduced. Used: rearview mirror, security mirror — wider field of view)
- **Mirror equation**: 1/f = 1/dₒ + 1/dᵢ. f = R/2 (focal length = half radius of curvature). Magnification m = -dᵢ/dₒ. Negative dᵢ = virtual image (behind mirror). Real images = inverted, can be projected. Virtual images = upright, cannot be projected

## Refraction
- **Snell's Law**: n₁ sin θ₁ = n₂ sin θ₂. Light bends toward normal when entering denser medium (n₂ > n₁ → θ₂ < θ₁). Bends away from normal when entering less dense medium
- **Total internal reflection**: When light goes from dense to less dense medium at angle > critical angle (θ_c = arcsin(n₂/n₁)). All light reflects back — none transmits. Used in: fiber optics, prisms (binoculars, periscopes), diamond sparkle (high n = small critical angle = more internal reflections)
- **Dispersion**: Different wavelengths refract differently (n varies with λ). Shorter wavelengths (blue) bend more than longer (red). Rainbows: water droplets disperse sunlight → internal reflection → see spectrum. Prisms separate white light into colors
- **Chromatic aberration**: Lenses focus different colors at slightly different points — causes color fringing. Corrected by: achromatic doublet (crown + flint glass lens elements with different dispersion), apochromatic (three elements for even better correction)

## Lenses
- **Convex (converging)**: Thicker in middle. Brings parallel rays to focus (positive focal length). Used in: magnifying glass, camera lens, eyeglasses for farsightedness, microscope objective. Object inside focal length → virtual/upright/magnified (magnifying glass). Object beyond focal length → real/inverted (camera forms image on sensor)
- **Concave (diverging)**: Thinner in middle. Spreads parallel rays (negative focal length). Used in: eyeglasses for nearsightedness, peephole (door viewer), some telescope designs. Always produces virtual, upright, reduced image
- **Lens equation**: 1/f = 1/dₒ + 1/dᵢ (same as mirror equation — sign conventions differ). Lensmaker's equation: 1/f = (n-1)(1/R₁ - 1/R₂). f positive for converging, negative for diverging
- **Thin lens approximation**: Focal length measured from lens center (valid if lens thickness << focal length). Most introductory optics uses this
- **Aberration types**: Spherical (marginal rays focus closer than paraxial — fixed by aspheric surfaces). Coma (off-axis point appears comet-shaped). Astigmatism (tangential and sagittal focal planes differ). Distortion (barrel/pincushion — straight lines curve). Field curvature (flat object → curved image plane)

## Optical Instruments
- **Camera**: Lens focuses image on sensor/film. Aperture (f-stop — f/2.8, f/5.6, f/11 — controls light + depth of field). Shutter speed (controls motion blur). Focal length determines field of view (wide 24mm, normal 50mm, telephoto 200mm)
- **Telescope**: Refracting (lens objective) vs reflecting (mirror objective). Angular magnification = f_objective / f_eyepiece. Larger objective = more light gathering (brighter image) + better resolution. Hubble (2.4m mirror), JWST (6.5m segmented mirror)
- **Microscope**: Objective (short focal length, high magnification) + eyepiece (further magnifies). Total mag = M_obj × M_eye. Resolution limited by diffraction (Abbe limit ~λ/2NA — about 200nm for visible light). Electron microscopes use electron beams (de Broglie wavelength ~0.004nm) → 50pm resolution
- **Fiber optics**: Core (high n) + cladding (lower n) — total internal reflection guides light. Single mode (core ~8μm, for long distances, lasers). Multi mode (core ~50μm, short distances, LEDs). Attenuation ~0.2 dB/km for modern telecom fiber (wavelength 1550nm). Used for: internet backbone, medical endoscopy, sensors, lighting

## Interference & Diffraction
- **Young's double-slit**: Light passes through two slits → interference pattern of bright and dark fringes. d sin θ = mλ (bright, m = integer). Proved wave nature of light. Fringe spacing = λL/d
- **Thin film interference**: Light reflects from top and bottom surfaces of thin film → interference. Colors in soap bubbles, oil slicks. Used in: anti-reflective coatings (λ/4 thickness gap cancels reflection — for glasses, camera lenses)
- **Diffraction gratings**: Many parallel slits (100-1000 lines/mm). Produces sharp spectral lines. d sin θ = nλ. Used in: spectrometers (identify materials by spectral lines — astronomy, chemistry, forensics)
- **Huygens' principle**: Every point on wavefront acts as source of spherical wavelets. Explains: refraction (wavelets slow in denser medium), diffraction (waves bend around obstacles), reflection

## Polarization
- **Linear polarization**: Electric field oscillates in single plane. Light from: reflection (glare — Brewster's angle), scattering (sky at 90° from sun), polarizing filters (Polaroid transmits one plane, absorbs perpendicular)
- **Circular/elliptical polarization**: E-field rotates as wave propagates. Produced by: quarter-wave plate, reflection at certain angles. Used in: 3D movies (RealD — opposite circular polarization per eye), LCD screens
- **Applications**: Polarized sunglasses (reduce glare from horizontal surfaces — road, water). Photographers (polarizing filter darkens sky, reduces reflections through windows). Stress analysis (photoelasticity — stressed plastic shows colored patterns under polarized light)
- **Brewster's angle**: θ_B = arctan(n₂/n₁) — reflected light fully polarized parallel to surface. At this angle, reflected + refracted rays are 90° apart. Practical: polarize laser light by reflection off glass at Brewster angle

## Lasers
- **Stimulated emission**: Photon encounters excited atom → atom emits identical photon (same direction, phase, polarization). Population inversion (more atoms excited than ground state) needed for laser action
- **Components**: Gain medium (solid, gas, semiconductor — provides amplification), Pump source (energy to achieve population inversion — flash lamp, electrical current, another laser), Optical cavity (mirrors — one fully reflective, one partially transmits — provides feedback + selects mode)
- **Types**: HeNe gas (red 632.8nm — common educational), CO₂ (infrared 10.6μm — industrial cutting), Nd:YAG (1064nm — surgery, welding), Semiconductor diode laser (near IR 780-980nm or visible — barcode scanners, fiber optics, laser pointers)
- **Properties**: Monochromatic (single wavelength), Coherent (same phase across wavefront), Collimated (tight beam, low divergence), High intensity (focused to tiny spot)
