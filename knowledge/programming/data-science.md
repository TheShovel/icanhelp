# Data Science & Analytics Basics

## Data Science Lifecycle
1. **Ask**: define problem, objectives, success criteria — what question are you trying to answer? What decision will this inform?
2. **Collect**: gather data (internal databases, APIs, surveys, web scraping, third-party)
   - Data quality: missing values, duplicates, outliers, inconsistencies — GARBAGE IN = GARBAGE OUT (90% of data science is cleaning data)
3. **Clean & prepare**: handle missing data, fix types, remove outliers (or not — depends), normalize/standardize, feature engineering, transform
   - Missing data: drop (if few), impute (mean/median/mode for numerical, most frequent for categorical), model-based imputation (MICE, KNN). Understand WHY data is missing (missing completely at random, missing at random, not missing at random)
   - Outliers: cap/floor, transform (log, Box-Cox), remove, or keep — depends on context (outlier = mistake OR valuable rare event like fraud)
4. **Explore & visualize** (EDA — Exploratory Data Analysis): understand patterns, distributions, relationships, anomalies. Graphs: histograms (distributions), scatter plots (relationships), box plots (outliers + quartiles), heatmaps (correlations), bar charts (categories)
   - Summary statistics: mean, median, mode, standard deviation, min/max, quartiles, skewness, kurtosis
   - Correlation: Pearson (linear), Spearman (monotonic). Correlation ≠ causation — spurious correlations (ice cream sales + drowning both increase in summer)
5. **Model**: choose algorithm, train/test split, cross-validation, hyperparameter tuning
   - Bias-variance tradeoff: simple model = underfitting (high bias). Complex model = overfitting (high variance). Goal: good balance on test data
6. **Evaluate**: metrics, confusion matrix, ROC curve, business impact — does the model actually solve the problem?
7. **Deploy & monitor**: put model in production, track performance over time (data drift = model degrades as real-world data changes). Most models never get deployed — biggest gap in data science

## Statistics You Need
- **Descriptive statistics**: summarize data — central tendency (mean, median, mode), dispersion (range, variance, standard deviation, IQR), shape (skewness, kurtosis)
  - Mean sensitive to outliers (income data: mean $200k with bill — which outliers make it non-representative). Median = better for skewed data
- **Inferential statistics**: draw conclusions from samples — hypothesis testing, confidence intervals, p-values
  - Null hypothesis (H0): nothing happening (no difference, no effect). Alternative(H1): something is happening
  - p-value: probability of observing data AS EXTREME as what we observed IF null hypothesis is true. p < 0.05 = reject null (convention, not magic — 0.05 means 5% chance of false positive)
  - Type I error (false positive): rejecting true null (thinking drug works when it doesn't). Type II error (false negative): failing to reject false null (missing real effect)
  - Confidence interval: range that likely contains true population parameter. 95% CI = if we repeated study 100 times, 95 intervals would contain true value
- **Regression**: linear (continuous outcome), logistic (binary outcome). R² = variance explained (0-1). Coefficients = effect size (how much Y changes per unit X)
  - Linear regression assumptions: linearity, independence, homoscedasticity (constant variance), normality of residuals
  - Multiple regression: control for confounders. Multicollinearity: when predictors correlated → unstable coefficients
- **Bayesian statistics**: start with prior belief, update with data → posterior belief. "What's the probability of hypothesis GIVEN the data? (vs frequentist: "probability of data given hypothesis")
  - Bayesian more intuitive for real-world reasoning but computationally harder. Increasingly popular (A/B testing, ML, forecasting)

## SQL for Analysis
```sql
-- Window functions (analytics)
SELECT
  user_id,
  order_date,
  amount,
  SUM(amount) OVER (PARTITION BY user_id ORDER BY order_date) AS running_total,
  AVG(amount) OVER (PARTITION BY user_id) AS avg_per_user,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date DESC) AS order_rank,
  LAG(amount) OVER (PARTITION BY user_id ORDER BY order_date) AS previous_order,
  LEAD(amount) OVER (PARTITION BY user_id ORDER BY order_date) AS next_order
FROM orders

-- Cohort analysis
SELECT
  DATE_TRUNC('month', first_order) AS cohort_month,
  months_since_first,
  COUNT(DISTINCT user_id) AS users,
  SUM(revenue) AS revenue
FROM cohort_table
GROUP BY 1, 2

-- Percentiles
PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median
PERCENTILE_CONT(0.25) -- Q1
PERCENTILE_CONT(0.75) -- Q3
```

## A/B Testing
- **Process**: random assignment (control vs treatment), measure metric, test for significant difference
  - Randomization: must be at unit of experiment (if testing feature that affects all users on server, unit = server not user — "unit of randomization must equal unit of analysis")
- **Sample size**: needed to detect effect of given size — too small = can't detect real difference. Power analysis before starting
  - Minimum detectable effect: smaller effect = larger sample needed. For small businesses: often lack traffic for meaningful A/B tests (may need 1000+ conversions/arm)
- **Common mistakes**: stopping early (at significance, but "peeking" inflates false positive rate dramatically), multiple metrics (run 20 tests, 1 will be "significant" at p<0.05 by chance — correct with Bonferroni, FDR), Simpson's paradox (overall trend reverses when data is grouped — classic example: Berkeley gender bias case)
  - Peeking problem: if you check results after every 100 users and stop when p<0.05, actual false positive rate is 50%+ (not 5%). Solution: pre-register sample size, don't peek, or use sequential testing

## Tools & Libraries
- **Python**: pandas (data manipulation), numpy (numerical), matplotlib/seaborn/plotly (visualization), scikit-learn (ML), statsmodels (statistics), Jupyter notebooks (interactive analysis)
  - Pandas essentials: DataFrame, groupby, merge/join, pivot_table, apply, fillna, read_csv, to_sql
  - Tip: use vectorized operations (df['col'].mean()) > for loops (slow). Use .value_counts(), .corr(), .describe() for quick EDA
- **R**: tidyverse (dplyr, ggplot2), caret, shiny (dashboards) — better for statistics, biostats, academic research. Learning curve: higher than Python for beginners, more intuitive for stats after learning
- **SQL**: every data analyst needs it — window functions, CTEs, date manipulation, joins, aggregation
- **BI tools**: Tableau (expensive, best viz), Power BI (Microsoft, good integration), Looker (Google, cloud-native), Metabase (open-source), Superset (Apache, open-source)

## Common Pitfalls
- **Survivorship bias**: only looking at survivors/ successes (surviving planes had fewer bullet holes = NOT where to add armor — survivors flew home despite those holes, missing planes were hit in engine where we don't see holes)
  - In business: analyzing only successful companies, ignoring failures
- **Selection bias**: sample not representative of population (restaurant only surveys dinner customers, misses lunch — different preferences)
- **Confirmation bias**: seek evidence that confirms beliefs, ignore contrary data. Solution: actively test the OPPOSITE hypothesis
- **Overfitting**: model learns noise/correlations in training data that don't generalize (perfect on training, terrible on test). Fix: simpler model, more data, regularization, cross-validation
  - "With 4 parameters I can fit an elephant, and with 5 I can make him wiggle his trunk" — John von Neumann
- **Data dredging / p-hacking**: running many tests until something is significant — EVERYTHING is correlated with EVERYTHING else if you look hard enough
  - Spurious correlations: US spending on science correlates with suicides by hanging. Per capita cheese consumption correlates with number of people who died by bedsheet strangulation
- **Ignoring base rates**: 99% accurate test for rare disease (1 in 10,000) — positive result means 1% chance you have it (most positives are false positives because disease is so rare). Bayes' theorem!
- **Causality ≠ correlation**: ice cream and drowning correlate (both increase in summer), but ice cream doesn't cause drowning (third variable: heat). Use randomized experiments (A/B tests) for causal claims
