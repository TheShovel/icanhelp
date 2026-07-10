# Cloud Computing Basics

## Cloud Service Models
- **IaaS** (Infrastructure as a Service): virtual machines, storage, networks — you manage OS, runtime, apps (AWS EC2, GCP Compute Engine, Azure VMs)
- **PaaS** (Platform as a Service): managed runtime, you deploy code (AWS Elastic Beanstalk, Heroku, Google App Engine, Vercel)
- **SaaS** (Software as a Service): ready-to-use app (Google Workspace, Salesforce, Slack, Dropbox)
- **FaaS** (Function as a Service / Serverless): run code in response to events, no server management (AWS Lambda, GCP Cloud Functions, Cloudflare Workers)
  - You only pay for compute time (millisecond billing)
  - Cold starts: first invocation after idle has latency penalty

## Major Providers
- **AWS** (Amazon Web Services): largest market share, most services (200+), steep learning curve, expensive if unmanaged
  - Regions: 30+ globally. AZ (Availability Zones): 3-6 per region
- **Google Cloud Platform (GCP)**: strong in data/AI/ML (BigQuery, Vertex AI), global network (best for data-intensive)
- **Microsoft Azure**: strong enterprise integration (Office 365, Active Directory), good for .NET shops
- **Cloudflare**: edge computing, CDN, Workers (serverless at edge, low latency worldwide)
- **Vercel / Netlify**: frontend-focused PaaS — excellent DX, serverless functions, edge, static hosting

## Core Services
- **Compute**: EC2 (VMs), Lambda (serverless), ECS/EKS (containers), Elastic Beanstalk (PaaS)
- **Storage**: S3 (object storage, unlimited, 99.999999999% durability), EBS (block storage for EC2), Glacier (archival, cheap)
  - S3 storage classes: Standard (frequent access), Infrequent Access (IA), Glacier (archival), Deep Archive (12+ hr retrieval)
- **Database**: RDS (managed SQL — Postgres, MySQL, Aurora, SQL Server), DynamoDB (NoSQL, key-value, single-digit ms latency), ElastiCache (Redis/Memcached)
  - RDS: automated backups, replication, failover, read replicas — use this unless you need to manage your own
- **Networking**: VPC (virtual private cloud), CloudFront (CDN), Route 53 (DNS), ELB/ALB (load balancers)
- **CDN**: CloudFront (AWS), Cloud CDN (GCP), Azure CDN, Cloudflare — cache static content at edge locations worldwide (lower latency, lower origin load)

## Compute Scaling
- **Vertical scaling**: bigger instance (more CPU/RAM) — limited by max instance size, downtime required
- **Horizontal scaling**: more instances — infinite, no downtime, requires load balancer
- **Auto-scaling**: automatically add/remove instances based on metrics (CPU > 70% → add, < 30% → remove)
  - Min/max instance count, cooldown periods, health checks
- **Serverless**: functions scale automatically to handle load (thousands of concurrent invocations)
  - Good for: event-driven, intermittent workloads, APIs, data processing
  - Bad for: long-running (>15 min Lambda limit), predictable high load (cheaper to have reserved), stateful apps

## Containers vs VMs
- **VMs**: virtual hardware + full OS — each VM has its own kernel — slower, heavier, less portable (VMware, VirtualBox, Hyper-V)
- **Containers**: share host OS kernel — isolate processes — fast to start, portable, resource-efficient (Docker)
  - Containers are NOT lightweight VMs — they're isolated processes sharing the kernel
- **Orchestration** (Kubernetes): manage hundreds of containers — scheduling, scaling, service discovery, rolling updates, self-healing
  - Complexity: K8s is powerful but operationally heavy. Consider managed K8s (EKS, GKE, AKS) or simpler alternatives (ECS, Nomad, Docker Swarm)

## Cost Management
- Biggest cloud cost mistakes: over-provisioned resources, unattached storage, unused load balancers, idle instances
- **Cost optimization**: right-size instances, use spot instances (up to 90% off, can be terminated), reserved instances (1-3 year commitment, up to 75% off), auto-scaling
  - Spot = AWS spare capacity, great for batch/stateless/fault-tolerant workloads, NOT for databases or stateful services
  - Reserved = consistent workloads (database, production API servers)
- **Monitor**: set budgets and alerts (AWS Budgets, GCP Billing Alerts), review cost explorer weekly
- **Tagging**: tag resources by environment (prod, staging, dev), project, team — enables cost allocation and cleanup

## Security & IAM
- **IAM** (Identity and Access Management): who (user/role) can do what (policy) on which resource
  - Principle of least privilege: grant minimum permissions needed, nothing more
  - Use roles (not long-lived access keys) for EC2 apps, Lambda functions
  - Access keys: rotate regularly (90 days max), never commit to code (use secrets manager or environment variables)
- **Shared responsibility model**: AWS/cloud provider secures the cloud (physical, network, hypervisor). YOU secure what's in the cloud (OS, app, data, access)
  - The provider is responsible FOR the cloud. You are responsible IN the cloud
- **Security groups**: instance-level firewalls (allow specific IP/port). NACLs: subnet-level firewalls (stateless)
  - Security groups are stateful (return traffic automatically allowed). NACLs are stateless (need rules for both directions)
- **Encryption**: at rest (S3 SSE, EBS encryption, RDS encryption — often free), in transit (TLS certificates, HTTPS)
- **Secrets**: AWS Secrets Manager / Parameter Store / GCP Secret Manager for API keys, database passwords — never in code

## Networking
- **VPC** (Virtual Private Cloud): your isolated network in the cloud
  - Subnets: public (with internet gateway, for load balancers, bastion hosts) vs private (no direct internet access, for databases, app servers)
  - NAT Gateway: allows private instances to access internet (download updates) but prevents inbound
  - VPN/ Direct Connect: connect on-premises to cloud
- **Load balancers**: distribute traffic across instances — health checks, SSL termination, auto-scaling integration
  - Application Load Balancer (ALB): HTTP/HTTPS, path-based routing, host-based, best for web apps
  - Network Load Balancer (NLB): TCP/UDP, ultra-low latency, high throughput
- **DNS**: Route 53 / Cloud DNS — domain registration, routing policies (simple, weighted, latency-based, geolocation, failover)

## Infrastructure as Code (IaC)
- **Terraform**: declarative, cloud-agnostic (AWS, GCP, Azure, etc.) — HCL language
  - State file: tracks what's deployed — critical, must be stored securely (S3 + DynamoDB lock)
  - Plan → Apply workflow (see what changes before making them)
- **CloudFormation**: AWS-native, JSON/YAML, harder to manage than Terraform
- **Pulumi**: IaC with real programming languages (TypeScript, Python, Go, C#)
- **CDK** (AWS CDK): define cloud resources using familiar languages (TypeScript, Python, Java, C#) — compiles to CloudFormation
- **Benefits**: repeatable, version-controlled, reviewable, self-documenting, destroyable
