# Machine Learning Engineering Fundamentals

## Overview
ML Engineering bridges the gap between ML research and production systems. It focuses on building reliable, scalable, and maintainable ML systems that deliver business value.

## ML System Lifecycle

### 1. Problem Definition
```
Business Problem → ML Problem → Success Metrics
```
- Translate business KPIs to ML metrics
- Define baseline (heuristic, random, existing model)
- Establish minimum viable performance

### 2. Data Engineering
```
Raw Data → Validation → Transformation → Feature Store → Training/Inference
```

#### Data Validation
```python
# Great Expectations example
import great_expectations as ge

context = ge.get_context()
batch = context.get_batch("my_datasource", "my_table")
results = batch.expect_column_values_to_not_be_null("user_id")
results = batch.expect_column_values_to_be_between("age", 0, 120)
results = batch.expect_column_distinct_values_to_be_in_set("status", ["active", "inactive"])
```

#### Data Versioning (DVC)
```bash
dvc init
dvc add data/raw/train.csv
dvc add data/processed/features.parquet
git add .dvc
git commit -m "Add dataset version"
dvc push  # To remote storage
```

### 3. Feature Engineering
```python
# Feature store pattern (Feast)
from feast import FeatureStore

store = FeatureStore(repo_path="feature_repo")

# Define features
entity = Entity(name="user_id", join_keys=["user_id"])
feature_view = FeatureView(
    name="user_features",
    entities=["user_id"],
    ttl=timedelta(days=30),
    schema=[
        Field(name="age", dtype=Int64),
        Field(name="past_purchase_count", dtype=Int64),
        Field(name="avg_order_value", dtype=Float32),
    ],
    online=True,
    source=FileSource(path="s3://bucket/features/user_features.parquet"),
)

# Retrieve for training
training_df = store.get_historical_features(
    entity_df=training_entity_df,
    features=["user_features:age", "user_features:past_purchase_count"],
).to_df()

# Online serving
features = store.get_online_features(
    entity_rows=[{"user_id": 123}],
    features=["user_features:age", "user_features:past_purchase_count"],
)
```

### 4. Model Training & Experimentation

#### Experiment Tracking (MLflow)
```python
import mlflow
import mlflow.sklearn

mlflow.set_experiment("customer-churn")

with mlflow.start_run():
    # Log parameters
    mlflow.log_param("n_estimators", 100)
    mlflow.log_param("max_depth", 5)
    
    # Train
    model = RandomForestClassifier(n_estimators=100, max_depth=5)
    model.fit(X_train, y_train)
    
    # Log metrics
    mlflow.log_metric("accuracy", accuracy_score(y_test, preds))
    mlflow.log_metric("f1", f1_score(y_test, preds))
    mlflow.log_metric("auc", roc_auc_score(y_test, probs))
    
    # Log model
    mlflow.sklearn.log_model(model, "model")
    
    # Log artifacts
    mlflow.log_artifact("confusion_matrix.png")
    mlflow.log_artifact("feature_importance.csv")
```

#### Hyperparameter Tuning (Optuna)
```python
import optuna

def objective(trial):
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 50, 300),
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "min_samples_split": trial.suggest_int("min_samples_split", 2, 10),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
    }
    
    model = XGBClassifier(**params)
    cv_scores = cross_val_score(model, X, y, cv=5, scoring="f1")
    return cv_scores.mean()

study = optuna.create_study(direction="maximize")
study.optimize(objective, n_trials=100)
best_params = study.best_params
```

### 5. Model Validation

#### Metrics by Problem Type
| Problem | Primary Metrics | Secondary Metrics |
|---------|-----------------|-------------------|
| Binary Classification | AUC-ROC, F1, Precision@K | Precision, Recall, LogLoss |
| Multi-class Classification | Macro F1, Accuracy | Per-class F1, Confusion Matrix |
| Regression | MAE, RMSE, MAPE | R², Quantile Loss |
| Ranking | NDCG@K, MRR | MAP@K, Recall@K |
| Detection | mAP@0.5:0.95 | Precision@IoU, Recall@IoU |

#### Cross-Validation Strategies
```python
from sklearn.model_selection import (
    KFold, StratifiedKFold, TimeSeriesSplit, GroupKFold
)

# Standard
cv = KFold(n_splits=5, shuffle=True, random_state=42)

# Stratified (classification)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Time series (no leakage!)
cv = TimeSeriesSplit(n_splits=5, gap=7)  # 7-day gap

# Grouped (e.g., user-level)
cv = GroupKFold(n_splits=5)

# Nested CV for unbiased estimation
outer_cv = KFold(5)
inner_cv = KFold(3)
```

#### Data Leakage Prevention
```python
# ❌ WRONG - preprocessing before split
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)  # Leaks test info!
X_train, X_test = train_test_split(X_scaled)

# ✅ CORRECT - pipeline prevents leakage
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", LogisticRegression()),
])

# ✅ CORRECT - fit_transform only on train
X_train, X_test, y_train, y_test = train_test_split(X, y)
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)  # transform only!
```

### 6. Model Deployment

#### Model Serving Patterns
| Pattern | Latency | Throughput | Use Case |
|---------|---------|------------|----------|
| **REST API** | 10-100ms | Medium | General purpose |
| **gRPC** | 5-50ms | High | Internal services |
| **Async Queue** | Variable | Very High | Batch, non-real-time |
| **Edge/Device** | <10ms | N/A | Mobile, IoT |
| **Batch** | Minutes-hours | Very High | Analytics, retraining |

#### FastAPI Serving Example
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import mlflow.pyfunc
import numpy as np

app = FastAPI()
model = mlflow.pyfunc.load_model("models:/churn-model/Production")

class PredictionRequest(BaseModel):
    user_id: int
    features: dict

class PredictionResponse(BaseModel):
    user_id: int
    churn_probability: float
    risk_level: str

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        # Prepare features
        feature_vector = prepare_features(request.features)
        
        # Predict
        prob = model.predict_proba([feature_vector])[0][1]
        
        # Business logic
        risk = "high" if prob > 0.7 else "medium" if prob > 0.3 else "low"
        
        return PredictionResponse(
            user_id=request.user_id,
            churn_probability=float(prob),
            risk_level=risk
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "model_version": model.metadata.run_id}
```

#### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model and code
COPY model/ ./model/
COPY app.py .

# Non-root user
RUN useradd -m -u 1000 appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: churn-model
spec:
  replicas: 3
  selector:
    matchLabels:
      app: churn-model
  template:
    metadata:
      labels:
        app: churn-model
    spec:
      containers:
      - name: model
        image: myregistry/churn-model:v1.2.3
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: churn-model
spec:
  selector:
    app: churn-model
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
```

### 7. Monitoring & Observability

#### Data Drift Detection
```python
from evidently.dashboard import Dashboard
from evidently.dashboard.tabs import DataDriftTab

# Reference (training) vs current (production)
dashboard = Dashboard(tabs=[DataDriftTab()])
dashboard.calculate(reference_data, current_data)
dashboard.save("drift_report.html")

# Programmatic checks
from evidently.metrics import DataDriftTable

drift_report = Dashboard(tabs=[DataDriftTab()])
drift_report.calculate(ref, curr)
metrics = drift_report.show()

# Alert if drift score > threshold
for column, metrics in drift_report.metrics.items():
    if metrics.drift_score > 0.1:
        alert(f"Drift detected in {column}: {metrics.drift_score}")
```

#### Model Performance Monitoring
```python
from prometheus_client import Counter, Histogram, Gauge

# Metrics
PREDICTION_COUNT = Counter('predictions_total', 'Total predictions', ['model', 'version'])
PREDICTION_LATENCY = Histogram('prediction_latency_seconds', 'Prediction latency')
MODEL_ACCURACY = Gauge('model_accuracy', 'Current model accuracy', ['model'])

@app.post("/predict")
async def predict(request):
    start = time.time()
    PREDICTION_COUNT.labels(model="churn", version="v1.2.3").inc()
    
    result = model.predict(features)
    
    PREDICTION_LATENCY.observe(time.time() - start)
    return result

# Background job updates accuracy gauge
def update_accuracy():
    daily_accuracy = calculate_daily_accuracy()
    MODEL_ACCURACY.labels(model="churn").set(daily_accuracy)
```

#### A/B Testing Framework
```python
class ABTestRouter:
    def __init__(self, model_a, model_b, traffic_split=0.5):
        self.model_a = model_a
        self.model_b = model_b
        self.split = traffic_split
    
    def route(self, user_id):
        # Deterministic assignment
        hash_val = hash(f"{user_id}:experiment") % 100
        return "B" if hash_val < self.split * 100 else "A"
    
    async def predict(self, request):
        variant = self.route(request.user_id)
        model = self.model_b if variant == "B" else self.model_a
        
        # Track assignment
        metrics.experiment_assignment.labels(variant=variant).inc()
        
        return await model.predict(request.features), variant

# Track metrics per variant
@app.post("/predict")
async def predict(request):
    result, variant = await router.predict(request)
    
    # Log for analysis
    log_experiment(
        user_id=request.user_id,
        variant=variant,
        prediction=result.prediction,
        latency=result.latency
    )
    
    return result
```

### 8. CI/CD for ML (MLOps)

#### GitHub Actions Workflow
```yaml
# .github/workflows/ml-pipeline.yml
name: ML Pipeline

on:
  push:
    branches: [main]
    paths: ['src/**', 'data/**', 'models/**']
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v --cov=src
      - run: black --check src/
      - run: ruff check src/
  
  train:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: iterative/setup-dvc@v1
      - run: dvc pull
      - run: python src/train.py
      - run: dvc push
      - uses: actions/upload-artifact@v3
        with:
          name: model
          path: models/
  
  evaluate:
    needs: train
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: model
          path: models/
      - run: python src/evaluate.py
        env:
          THRESHOLD_ACCURACY: 0.85
  
  deploy-staging:
    needs: evaluate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v2
      - run: |
          aws ecr get-login-password | docker login ...
          docker build -t model:staging .
          docker push ...
      - run: kubectl set image deployment/model model=model:staging -n staging

  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: kubectl set image deployment/model model=model:latest -n production
```

#### Model Registry (MLflow)
```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Register model
model_uri = f"runs:/{run_id}/model"
mv = mlflow.register_model(model_uri, "churn-model")

# Transition stages
client.transition_model_version_stage(
    name="churn-model",
    version=mv.version,
    stage="Staging",
)

# After validation
client.transition_model_version_stage(
    name="churn-model",
    version=mv.version,
    stage="Production",
    archive_existing_versions=True,
)

# Rollback
client.transition_model_version_stage(
    name="churn-model",
    version=previous_version,
    stage="Production",
    archive_existing_versions=True,
)
```

### 9. Feature Stores

#### Architecture
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Data Sources│────▶│  Feature Store│────▶│  Consumers  │
│ (DB, Kafka, │     │ (Feast,       │     │ (Training,  │
│  S3, etc.)  │     │  Hopsworks,   │     │  Inference) │
└─────────────┘     │  Tecton)      │     └─────────────┘
                    └──────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │ Offline  │  │ Online   │
              │ Store    │  │ Store    │
              │ (Parquet,│  │ (Redis,  │
              │  Iceberg)│  │  Dynamo) │
              └──────────┘  └──────────┘
```

### 10. Responsible AI

#### Fairness Checks
```python
from fairlearn.metrics import (
    demographic_parity_difference,
    equalized_odds_difference,
)

# Binary sensitive feature
sensitive_feature = test_df["gender"]

dp_diff = demographic_parity_difference(
    y_test, y_pred, sensitive_features=sensitive_feature
)
eo_diff = equalized_odds_difference(
    y_test, y_pred, sensitive_features=sensitive_feature
)

assert abs(dp_diff) < 0.1, f"Demographic parity violation: {dp_diff}"
assert abs(eo_diff) < 0.1, f"Equalized odds violation: {eo_diff}"
```

#### Explainability (SHAP)
```python
import shap

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# Global importance
shap.summary_plot(shap_values, X_test)

# Local explanation
shap.force_plot(explainer.expected_value, shap_values[0], X_test.iloc[0])

# Global dependence
shap.dependence_plot("age", shap_values, X_test)
```

## Tools Ecosystem

| Category | Tools |
|----------|-------|
| **Experiment Tracking** | MLflow, Weights & Biases, Neptune, ClearML |
| **Orchestration** | Airflow, Prefect, Dagster, Kubeflow Pipelines |
| **Feature Store** | Feast, Hopsworks, Tecton, Dagster |
| **Model Registry** | MLflow, ModelDB, Neptune |
| **Serving** | TensorFlow Serving, TorchServe, Triton, BentoML |
| **Monitoring** | Evidently, WhyLabs, Arize, Prometheus/Grafana |
| **Data Versioning** | DVC, LakeFS, Delta Lake |
| **Quality** | Great Expectations, Deequ, Pandera |
| **AutoML** | Optuna, Hyperopt, Ray Tune, H2O |

## Resources
- **Books**: "Designing Machine Learning Systems" (Chip Huyen), "Machine Learning Engineering" (Andriy Burkov)
- **Courses**: Full Stack Deep Learning, Made With ML, MLOps Zoomcamp
- **Communities**: MLOps.community, r/MLOps, MLflow Slack