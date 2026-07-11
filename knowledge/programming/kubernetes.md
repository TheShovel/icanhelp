# Kubernetes

## Overview
Kubernetes (K8s) is an open-source container orchestration platform that automates deployment, scaling, and management of containerized applications.

## Core Concepts

### Cluster Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Control Plane                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐    │
│  │ API     │  │ Scheduler│  │ Controller│  │ etcd        │    │
│  │ Server  │  │         │  │ Manager  │  │ (datastore) │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ Worker   │    │ Worker   │    │ Worker   │
        │ Node 1   │    │ Node 2   │    │ Node N   │
        │          │    │          │    │          │
        │ ┌──────┐ │    │ ┌──────┐ │    │ ┌──────┐ │
        │ │Kubelet│ │    │ │Kubelet│ │    │ │Kubelet│ │
        │ │kube- │ │    │ │kube- │ │    │ │kube- │ │
        │ │proxy │ │    │ │proxy │ │    │ │proxy │ │
        │ │      │ │    │ │      │ │    │ │      │ │
        │ │Pods  │ │    │ │Pods  │ │    │ │Pods  │ │
        │ └──────┘ │    │ └──────┘ │    │ └──────┘ │
        └──────────┘    └──────────┘    └──────────┘
```

### Objects

#### Pod
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.25
    ports:
    - containerPort: 80
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    env:
    - name: ENV_VAR
      value: "value"
    volumeMounts:
    - name: config
      mountPath: /etc/config
  volumes:
  - name: config
    configMap:
      name: nginx-config
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 20
```

#### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP  # ClusterIP, NodePort, LoadBalancer, ExternalName
```

#### ConfigMap & Secret
```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  config.yaml: |
    key: value
    nested:
      key: value

---
# Secret
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
stringData:
  DATABASE_URL: "postgres://user:pass@host:5432/db"
  API_KEY: "secret-key"
```

#### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8080
```

#### PersistentVolume & PersistentVolumeClaim
```yaml
# PV (cluster admin creates)
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-data
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: fast-storage
  hostPath:
    path: /mnt/data

---
# PVC (user creates)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: fast-storage
```

#### StatefulSet
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

#### DaemonSet
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      containers:
      - name: node-exporter
        image: prometheus/node-exporter:v1.6
        ports:
        - containerPort: 9100
      tolerations:
      - operator: Exists
```

#### Job & CronJob
```yaml
# Job
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: myapp/migrate:latest
        command: ["python", "migrate.py"]
      restartPolicy: OnFailure
  backoffLimit: 4

---
# CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: myapp/backup:latest
          restartPolicy: OnFailure
```

## kubectl Commands

### Cluster Info
```bash
kubectl cluster-info
kubectl version
kubectl config view
kubectl config get-contexts
kubectl config use-context <context>
```

### Resources
```bash
# Get resources
kubectl get pods
kubectl get pods -n namespace
kubectl get pods -o wide
kubectl get pods -l app=nginx
kubectl get deployments,services,ingress
kubectl get all -n namespace

# Describe
kubectl describe pod <pod-name>
kubectl describe deployment <name>

# Create
kubectl apply -f file.yaml
kubectl apply -f dir/
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=NodePort

# Update
kubectl set image deployment/nginx nginx=nginx:1.26
kubectl rollout restart deployment/nginx
kubectl rollout status deployment/nginx
kubectl rollout history deployment/nginx
kubectl rollout undo deployment/nginx

# Delete
kubectl delete -f file.yaml
kubectl delete pod <name>
kubectl delete deployment <name>

# Scale
kubectl scale deployment nginx --replicas=5
kubectl autoscale deployment nginx --min=3 --max=10 --cpu-percent=80
```

### Debugging
```bash
# Logs
kubectl logs <pod-name>
kubectl logs <pod-name> -c <container-name>
kubectl logs -f <pod-name>  # follow
kubectl logs --previous <pod-name>  # previous container

# Exec
kubectl exec -it <pod-name> -- /bin/bash
kubectl exec <pod-name> -- ls /app

# Port forward
kubectl port-forward <pod-name> 8080:80
kubectl port-forward svc/<service-name> 8080:80

# Copy files
kubectl cp <pod-name>:/path/to/file ./local-file
kubectl cp ./local-file <pod-name>:/path/to/file

# Events
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl get events -n namespace

# Resource usage
kubectl top nodes
kubectl top pods
kubectl top pods -n namespace
```

### Troubleshooting
```bash
# Check node status
kubectl get nodes -o wide
kubectl describe node <node-name>

# Check component status
kubectl get componentstatuses

# API server logs (if accessible)
kubectl logs -n kube-system kube-apiserver-<node>

# DNS issues
kubectl run -it --rm --restart=Never dns-test --image=busybox -- nslookup kubernetes.default

# Network policies
kubectl get networkpolicies -A

# Certificates
kubectl get csr
kubectl certificate approve <csr-name>
```

## Helm (Package Manager)

### Charts
```bash
# Install chart
helm install my-release ./my-chart
helm install my-release stable/nginx-ingress

# Upgrade
helm upgrade my-release ./my-chart
helm upgrade my-release ./my-chart --set image.tag=v2.0

# Rollback
helm rollback my-release 1

# List
helm list
helm list -n namespace

# Template (render without installing)
helm template my-release ./my-chart

# Create chart
helm create my-chart
```

### Chart Structure
```
my-chart/
├── Chart.yaml          # Metadata
├── values.yaml         # Default values
├── templates/          # Templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── _helpers.tpl    # Template helpers
│   └── NOTES.txt       # Post-install notes
└── charts/             # Dependencies
```

### values.yaml
```yaml
replicaCount: 3

image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: app-tls
      hosts:
        - app.example.com

resources:
  limits:
    cpu: 500m
    memory: 128Mi
  requests:
    cpu: 250m
    memory: 64Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## Operators

### Operator Pattern
```yaml
# Custom Resource Definition
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              version:
                type: string
              replicas:
                type: integer
  scope: Namespaced
  names:
    plural: databases
    singular: database
    kind: Database
```

### Operator SDK
```bash
# Initialize
operator-sdk init --domain example.com --repo github.com/example/db-operator

# Create API
operator-sdk create api --group cache --version v1 --kind Database --resource --controller

# Build and run
make docker-build docker-push IMG=example.com/db-operator:v0.0.1
make deploy IMG=example.com/db-operator:v0.0.1
```

## Security

### RBAC
```yaml
# Role (namespace-scoped)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
```

### Pod Security Standards
```yaml
# Restricted namespace
apiVersion: v1
kind: Namespace
metadata:
  name: restricted
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

## Monitoring & Logging

### Prometheus Operator
```yaml
# ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: app-monitor
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: metrics
    interval: 30s
```

### Logging (EFK/Loki)
```yaml
# Fluent Bit DaemonSet for Loki
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:2.1
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: fluent-bit-config
          mountPath: /fluent-bit/etc/fluent-bit.conf
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: fluent-bit-config
        configMap:
          name: fluent-bit-config
```

## GitOps

### ArgoCD
```yaml
# Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/manifests
    targetRevision: HEAD
    path: overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### Flux
```bash
# Install Flux
flux bootstrap github \
  --owner=org \
  --repository=manifests \
  --branch=main \
  --path=clusters/production \
  --personal
```

## Best Practices

### Resource Management
```yaml
# Always set requests and limits
resources:
  requests:
    memory: "64Mi"
    cpu: "250m"
  limits:
    memory: "128Mi"
    cpu: "500m"

# Use LimitRange for defaults
apiVersion: v1
kind: LimitRange
metadata:
  name: mem-limit-range
spec:
  limits:
  - default:
      memory: 512Mi
      cpu: 1
    defaultRequest:
      memory: 256Mi
      cpu: 0.5
    type: Container
```

### Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /startup
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 30
```

### Labels & Annotations
```yaml
metadata:
  labels:
    app: myapp
    version: v1.2.3
    environment: production
    team: backend
  annotations:
    description: "My application"
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
```

### Multi-container Pods
```yaml
# Sidecar pattern
spec:
  containers:
  - name: app
    image: myapp:latest
    volumeMounts:
    - name: logs
      mountPath: /var/log
  - name: log-shipper
    image: fluent/fluent-bit:2.1
    volumeMounts:
    - name: logs
      mountPath: /var/log
  volumes:
  - name: logs
    emptyDir: {}
```

## Troubleshooting Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Pod stuck Pending | `kubectl describe pod` | Check resources, node affinity, PVC binding |
| Pod CrashLoopBackOff | `kubectl logs --previous` | Fix application bug, check config |
| Service not accessible | `kubectl get endpoints` | Check selector matches pod labels |
| ImagePullBackOff | `kubectl describe pod` | Check image name, credentials, registry |
| OOMKilled | `kubectl describe pod` | Increase memory limit, fix memory leak |
| Node NotReady | `kubectl describe node` | Check kubelet, disk pressure, network |

## Tools

| Tool | Purpose |
|------|---------|
| `kubectl` | CLI for cluster management |
| `helm` | Package manager |
| `k9s` | Terminal UI |
| `lens` | Desktop IDE |
| `kustomize` | Native config management |
| `argocd`/`flux` | GitOps |
| `prometheus`/`grafana` | Monitoring |
| `jaeger`/`tempo` | Distributed tracing |
| `kyverno`/`gatekeeper` | Policy enforcement |
| `velero` | Backup/restore |

## Resources
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kubernetes API Reference](https://kubernetes.io/docs/reference/)
- [CKA/CKAD Study Guide](https://github.com/kubernetes/kubernetes)
- [Kubernetes The Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way)
- [Awesome Kubernetes](https://github.com/ramitsurana/awesome-kubernetes)