# Statistics Practical Reference

## Descriptive Statistics

### Central Tendency
```
Mean:     x̄ = Σx / n
Median:   Middle value (or avg of two middle)
Mode:     Most frequent value
Trimmed mean: Remove top/bottom k% then average
Geometric mean: (∏x)^(1/n) - for ratios/growth rates
Harmonic mean: n / Σ(1/x) - for rates
```

### Dispersion
```
Range:         max - min
IQR:           Q3 - Q1 (robust)
Variance:      s² = Σ(x - x̄)² / (n-1)
Std dev:       s = √variance
CV:            s / x̄ (unitless, compare across scales)
MAD:           median(|x - median|) (robust)
```

### Shape
```
Skewness:  asymmetry (0 = symmetric, + = right tail, - = left tail)
Kurtosis:  tail heaviness (3 = normal, >3 = heavy tails, <3 = light)
```

## Probability Basics

### Rules
```
P(A∪B) = P(A) + P(B) - P(A∩B)
P(A|B) = P(A∩B) / P(B)        (Bayes)
P(A∩B) = P(A|B)P(B) = P(B|A)P(A)
Independent: P(A∩B) = P(A)P(B)
Mutually exclusive: P(A∩B) = 0
Law of total probability: P(A) = Σ P(A|Bᵢ)P(Bᵢ)
Bayes: P(A|B) = P(B|A)P(A) / P(B)
```

### Common Distributions
```
Bernoulli:  1 trial, p success
Binomial:   n trials, X ~ Bin(n,p), P(X=k) = C(n,k)pᵏ(1-p)ⁿ⁻ᵏ
Poisson:    Events in interval, X ~ Pois(λ), P(X=k) = e⁻λ λᵏ/k!
Normal:     X ~ N(μ,σ²), symmetric, bell curve
Exponential: Time between events, f(x) = λe⁻λˣ
Uniform:    Equal probability over [a,b]
t-dist:     Like normal, heavier tails, df = n-1
Chi-square: Sum of squared normals, df = n
F-dist:     Ratio of chi-squares, df₁, df₂
```

## Sampling Distributions

### Central Limit Theorem
```
For large n (n≥30), sample mean distribution ≈ Normal
x̄ ~ N(μ, σ/√n)
Sample proportion: p̂ ~ N(p, √(p(1-p)/n))
```

### Standard Error
```
SE_mean = σ/√n (or s/√n if σ unknown)
SE_prop = √(p(1-p)/n)
SE_diff_means = √(σ₁²/n₁ + σ₂²/n₂)
```

## Confidence Intervals

### Mean (σ known)
```
x̄ ± z*(σ/√n)
z* values: 90%→1.645, 95%→1.96, 99%→2.576
```

### Mean (σ unknown, t-distribution)
```
x̄ ± t*(s/√n), df = n-1
```

### Proportion
```
p̂ ± z*√(p̂(1-p̂)/n)
Wilson score interval (better for small n/extreme p)
```

### Difference of Means
```
(x̄₁ - x̄₂) ± t*√(s₁²/n₁ + s₂²/n₂)  (Welch)
Paired: d̄ ± t*(s_d/√n)
```

## Hypothesis Testing

### Framework
```
H₀: Null hypothesis (no effect, status quo)
H₁: Alternative (what you're testing for)
α: Significance level (usually 0.05)
Test statistic: Standardized distance from H₀
p-value: P(data as extreme | H₀ true)
Decision: Reject H₀ if p < α
```

### Common Tests

#### One Sample t-test
```
H₀: μ = μ₀
t = (x̄ - μ₀) / (s/√n), df = n-1
```

#### Two Sample t-test (Independent)
```
H₀: μ₁ = μ₂
t = (x̄₁ - x̄₂) / √(s₁²/n₁ + s₂²/n₂)
df (Welch): complex, use software
Assumptions: Independence, normality (or large n)
```

#### Paired t-test
```
H₀: μ_d = 0
d = x₁ - x₂ for each pair
t = d̄ / (s_d/√n)
```

#### One Sample Proportion (z-test)
```
H₀: p = p₀
z = (p̂ - p₀) / √(p₀(1-p₀)/n)
```

#### Two Proportion (z-test)
```
H₀: p₁ = p₂
Pooled: p̂ = (x₁+x₂)/(n₁+n₂)
z = (p̂₁ - p̂₂) / √(p̂(1-p̂)(1/n₁ + 1/n₂))
```

#### Chi-Square Tests
```
Goodness of fit: Σ(O-E)²/E, df = k-1
Independence: Σ(O-E)²/E, df = (r-1)(c-1)
Assumptions: Expected counts ≥ 5
```

#### ANOVA (One-Way)
```
H₀: μ₁ = μ₂ = ... = μk
F = MS_between / MS_within
df₁ = k-1, df₂ = N-k
Assumptions: Normality, equal variances, independence
Post-hoc: Tukey HSD, Bonferroni
```

#### Non-Parametric Alternatives
```
Mann-Whitney U: Two independent samples
Wilcoxon signed-rank: Paired samples
Kruskal-Wallis: k independent samples
Spearman: Rank correlation
```

## Regression

### Simple Linear Regression
```
y = β₀ + β₁x + ε
β₁ = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)²
β₀ = ȳ - β₁x̄
R² = 1 - SS_res/SS_tot = corr(x,y)²
SE(β₁) = s / √Σ(x-x̄)², s = √(SS_res/(n-2))
t = β₁/SE(β₁), df = n-2
CI: β₁ ± t*SE(β₁)
```

### Multiple Regression
```
y = β₀ + β₁x₁ + ... + βₖxₖ + ε
Matrix: β = (X'X)⁻¹X'y
Assumptions: Linearity, independence, homoscedasticity, normality
Check: Residual plots, VIF (multicollinearity >5-10), Cook's distance
Model selection: AIC, BIC, adjusted R², cross-validation
```

### Diagnostics
```
Residuals vs fitted: Non-linearity, heteroscedasticity
Q-Q plot: Normality
Scale-location: Homoscedasticity
Residuals vs leverage: Influential points
Cook's D > 4/n: Influential
VIF > 5-10: Multicollinearity
Durbin-Watson: Autocorrelation (≈2 = none)
```

## Experimental Design

### Randomization
```
Completely randomized: Random assign to treatments
Randomized block: Block by nuisance variable, randomize within
Latin square: Two blocking factors
Factorial: All combinations of factors
```

### Power Analysis
```
Power = 1 - β = P(reject H₀ | H₁ true)
Depends: α, effect size, n, variability
Cohen's d: (μ₁-μ₂)/σ (small=0.2, med=0.5, large=0.8)
For 80% power, α=0.05, two-sided:
  d=0.5 → n≈64/group
  d=0.8 → n≈26/group
```

### Sample Size
```
Mean (one sample): n = (z*σ/E)²
Proportion: n = z²p(1-p)/E² (use p=0.5 for max)
Two means: n = 2(z*σ/E)²
```

## Common Pitfalls

### Misinterpretations
```
p-value ≠ P(H₀ true) or P(H₁ true)
p-value ≠ effect size
Statistical significance ≠ practical significance
Confidence interval ≠ probability parameter in interval
"Accept H₀" → "Fail to reject H₀"
```

### Multiple Testing
```
Family-wise error rate increases with tests
Bonferroni: α_adj = α/m
Benjamini-Hochberg: FDR control
Pre-register hypotheses
```

### P-Hacking
```
Optional stopping (peeking)
Dropping outliers post-hoc
Multiple models, report best
HARKing (Hypothesizing After Results Known)
```

### Correlation ≠ Causation
```
Confounding, reverse causality, selection bias
RCTs → causal (if well-designed)
Observational: Adjust, match, IV, diff-in-diff, RD
```

## Data Visualization Best Practices

### Principles
```
Show the data
Maximize data-ink ratio
Avoid chartjunk
Use color purposefully (colorblind-safe)
Label directly, not legend
Start axes at zero (bar charts)
Log scale for multiplicative data
```

### Chart Selection
```
Distribution: Histogram, density, boxplot, violin
Relationship: Scatter, hexbin, line (time series)
Comparison: Bar (categorical), dot plot
Composition: Stacked bar (few), treemap
Uncertainty: Error bars, CI bands, fan charts
```

## Statistical Software Quick Reference

### R
```
t.test(x, mu=0)              # one sample
t.test(x, y)                 # two sample
t.test(x, y, paired=TRUE)    # paired
prop.test(x, n)              # proportion
chisq.test(table)            # chi-square
aov(y ~ x, data)             # ANOVA
lm(y ~ x, data)              # regression
summary(model)               # details
plot(model)                  # diagnostics
power.t.test(delta=0.5, sd=1, power=0.8)  # power
```

### Python (statsmodels/scipy)
```
from scipy import stats
stats.ttest_1samp(x, 0)
stats.ttest_ind(x, y)
stats.ttest_rel(x, y)
stats.proportions_ztest(count, nobs)
stats.chi2_contingency(table)
stats.f_oneway(*groups)
import statsmodels.api as sm
sm.OLS(y, sm.add_constant(x)).fit()
from statsmodels.stats.power import TTestIndPower
```

### Excel
```
=T.TEST(array1, array2, tails, type)
=CHISQ.TEST(actual, expected)
=ANOVA (Data Analysis Toolpak)
=LINEST(y, x, TRUE, TRUE)
=CONFIDENCE.T(alpha, sd, n)
```

## Effect Size Reporting

### Cohen's d
```
d = (x̄₁ - x̄₂) / s_pooled
s_pooled = √((s₁²+s₂²)/2)
Interpretation: 0.2 small, 0.5 medium, 0.8 large
```

### Correlation
```
r = Σ(x-x̄)(y-ȳ) / √(Σ(x-x̄)²Σ(y-ȳ)²)
Interpretation: 0.1 small, 0.3 medium, 0.5 large
```

### Odds Ratio / Risk Ratio
```
OR = (a/b) / (c/d) = ad/bc
RR = (a/(a+b)) / (c/(c+d))
Logistic regression: exp(β) = OR
```

### Eta Squared (ANOVA)
```
η² = SS_between / SS_total
Partial η² = SS_effect / (SS_effect + SS_error)
Interpretation: 0.01 small, 0.06 medium, 0.14 large
```

## Reporting Checklist (APA Style)
```
□ Test name and justification
□ Assumptions checked
□ Test statistic value
□ Degrees of freedom
□ p-value (exact, not p<.05)
□ Effect size with CI
□ Sample sizes
□ Descriptive stats (M, SD)
□ Direction of effect
□ Practical significance
```