# Kubernetes & Container Orchestration

## Core Concepts
- **Kubernetes (K8s)**: open-source platform for automating deployment, scaling, and management of containerized applications
  - Declarative configuration (YAML) — you say WHAT you want, K8s figures out HOW
  - Self-healing, auto-scaling, rolling updates, service discovery, load balancing, storage orchestration
- **Cluster**: set of machines (nodes) running K8s — master (control plane) + workers
- **Node**: single machine in cluster — can be physical or virtual
  - Worker node runs pods (kubelet + kube-proxy + container runtime)
  - Control plane node runs: API server, scheduler, controller manager, etcd (distributed key-value store)

## Pods
- **Pod**: smallest deployable unit — one or more containers that share network, storage, and lifecycle
  - Each pod gets its own IP address (ephemeral — pods come and go)
  - Sidecar pattern: main container + helper container (logging, proxy, config reload) in same pod
  - Multi-container pods: containers share filesystem (volumes) and network (localhost)
- **Pod lifecycle**: Pending → Running → Succeeded/Failed → Unknown
  - CrashLoopBackOff: pod keeps crashing, K8s waits before restarting (exponential backoff)
  - Init containers: run to completion before app containers start (setup, DB migrations, permissions)

## Deployments
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:1.2.3
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: production
        resources:
          requests: { cpu: "100m", memory: "128Mi" }
          limits: { cpu: "500m", memory: "256Mi" }
        readinessProbe:
          httpGet: { path: /health, port: 8080 }
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet: { path: /live, port: 8080 }
          initialDelaySeconds: 15
          periodSeconds: 20
```
- **Rolling update**: gradually replaces pods (max surge, max unavailable). Zero-downtime if configured correctly
  - kubectl rollout status deployment/my-app
  - kubectl rollout undo deployment/my-app (rollback)
- **Strategy types**: RollingUpdate (default, gradual), Recreate (kill all then create — downtime)

## Services & Networking
- **Service**: stable endpoint for pods (pods die, Services don't)
  - ClusterIP: internal only (default). NodePort: access via node IP + port (30000-32767). LoadBalancer: cloud load balancer (external IP). ExternalName: DNS alias
  - Services use label selectors to find which pods to route to
- **Ingress**: HTTP/HTTPS routing (host + path → service). Requires Ingress Controller (nginx-ingress, Traefik, AWS ALB Ingress Controller)
  - TLS termination at ingress level (cert-manager for automatic Let's Encrypt)
- **DNS**: built-in (CoreDNS) — pod-to-pod via service name: my-svc.namespace.svc.cluster.local
- **Network policies**: firewall rules within cluster — by default, all pods can talk to all pods (zero trust needs policies)
  - Requires CNI that supports policies (Calico, Cilium)

## Config & Secrets
- **ConfigMap**: non-sensitive configuration (environment variables, config files)
- **Secret**: sensitive data (passwords, API keys, certificates) — base64 encoded (NOT encrypted by default; enable encryption at rest)
- **Both**: injected as env vars or mounted as volumes (volume is better — updates without restart)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: production
  config.yaml: |
    key: value
```

## Storage
- **Volumes**: directory accessible to container — types: emptyDir (ephemeral), hostPath (node filesystem, avoid), persistentVolumeClaim (PVC — recommended)
  - PVC: requests storage (ReadWriteOnce, ReadOnlyMany, ReadWriteMany). StorageClass: dynamically provisions (EBS, GCE PD, Azure Disk, NFS, local)
- **StatefulSet**: for stateful apps (databases) — stable network identity, ordered deployment/ scaling, persistent storage per pod
  - StatefulSets are harder to manage than Deployments — prefer managed DB (RDS, Cloud SQL) if possible
- **DaemonSet**: runs one pod on each node (logging agents, monitoring, CNI plugins)
- **Job/CronJob**: run to completion (batch processing, backups)

## kubectl (Common Commands)
```
kubectl get pods                  — list pods
kubectl get deployments           — list deployments
kubectl get services              — list services
kubectl get nodes                 — cluster nodes
kubectl get events                — cluster events (debugging)
kubectl describe pod <name>       — detailed pod info (events!)
kubectl logs <pod> [-c container] — container logs
kubectl logs -f <pod>             — follow logs
kubectl exec -it <pod> -- bash    — shell into container
kubectl apply -f file.yaml        — create/update
kubectl delete -f file.yaml       — delete
kubectl port-forward pod 8080:80  — forward local port to pod
kubectl get all -n namespace      — all resources in namespace
kubectl top pods                  — resource usage (metrics server needed)
kubectl get pod -w                — watch (live updates)
kubectl set image deploy/app app=app:2.0 — update image (imperative)
kubectl rollout undo deploy/app   — rollback
```

## Helm (Package Manager)
- **Chart**: bundle of K8s manifests (templates + values.yaml). Install/upgrade/rollback as one unit
  - `helm install my-release ./chart` — install chart
  - `helm upgrade my-release ./chart -f values-prod.yaml` — upgrade
  - `helm rollback my-release 1` — rollback to revision 1
- **Values**: override default config per environment (dev, staging, prod)
  - Template language: Go templates ({{ .Values.replicaCount }})
- **Chart repository**: public (Artifact Hub, Bitnami) or private — share packaged apps

## Production Considerations
- **Resource requests & limits**: ALWAYS set these — without limits, one app can starve the cluster
  - Requests: guaranteed minimum. Limits: hard cap (container throttled/ killed if exceeded)
  - CPU is compressible (throttled), memory is not (killed/OOM)
  - Quality of Service: Guaranteed (limits = requests), Burstable (requests < limits), BestEffort (none set)
- **Horizontal Pod Autoscaler (HPA)**: automatically scales replicas based on CPU/memory or custom metrics
  - Need metrics server installed. HPA + cluster autoscaler (adds/removes nodes)
- **PodDisruptionBudget (PDB)**: ensures minimum number of pods are available during voluntary disruptions (node maintenance, rolling updates)
- **Namespace**: virtual cluster — isolate environments (dev, staging, prod), RBAC per namespace
- **RBAC**: Role (permissions) + RoleBinding (who gets them). ClusterRole/RoleBinding for cluster-scoped
- **Resource Quota**: limit total CPU/memory/pods per namespace (prevent one team from using everything)

## Managed K8s (Cloud)
- **Amazon EKS**: standard K8s, some AWS integration (ALB Ingress, IAM for service accounts, EBS CSI)
- **Google GKE**: autopilot (serverless K8s), best user experience, integrated monitoring
- **Azure AKS**: good Windows support, Azure AD integration
- **Alternatives**: K3s (lightweight, for edge/IoT/Raspberry Pi), MicroK8s (Canonical, single-node dev), Kind (K8s in Docker for testing), Minikube (local single-node)

## When NOT to Use K8s
- Small team (<10) with a few services: simpler is better (docker compose, single server, Heroku, PaaS, Vercel/Railway/Render)
- Low traffic app: one server with docker compose + monitoring is cheaper and simpler
- Already using a PaaS: if you don't need K8s features (scaling, portability, multi-cloud), PaaS is easier
- K8s adds massive operational complexity — you need dedicated team time for cluster management
  - "You don't need Kubernetes" is a common saying for good reason — it solves problems most people don't have
