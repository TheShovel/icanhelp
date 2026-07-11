# AWS Services Cheat Sheet

## Compute

| Service | Use Case | Key Features |
|---------|----------|--------------|
| **EC2** | Virtual servers | Full control, various instance types |
| **ECS** | Container orchestration | Docker, Fargate (serverless), EC2 launch types |
| **EKS** | Managed Kubernetes | K8s control plane, Fargate/EC2 nodes |
| **Lambda** | Serverless functions | Event-driven, pay per invocation, 15min max |
| **Fargate** | Serverless containers | No EC2 management, per-vCPU/memory pricing |
| **Batch** | Batch computing | Managed job queues, spot integration |
| **Lightsail** | Simple VPS | Predictable pricing, pre-configured |

### Instance Types

```
General Purpose:    t3/t4g (burstable), m5/m6g/m7g (balanced)
Compute Optimized:  c5/c6g/c7g (high CPU)
Memory Optimized:   r5/r6g/r7g (high RAM), x2idn (extreme)
Storage Optimized:  i3/i4g (NVMe SSD), d3/d3en (HDD)
Accelerated:        p4/p5 (GPU), inf1/inf2 (inference), g5/g6 (graphics)
```

### Lambda Limits

| Limit | Value |
|-------|-------|
| Timeout | 15 minutes |
| Memory | 128 MB - 10,240 MB |
| Ephemeral storage | 512 MB - 10 GB |
| Concurrent executions | 1,000 (soft) |
| Payload (sync) | 6 MB |
| Payload (async) | 256 KB |
| Deployment package | 50 MB (zipped), 250 MB (unzipped) |

## Storage

| Service | Type | Use Case |
|---------|------|----------|
| **S3** | Object | Static assets, backups, data lake |
| **EBS** | Block | EC2 volumes, databases |
| **EFS** | File (NFS) | Shared file storage, Lambda |
| **FSx** | File (Windows/Lustre) | Windows apps, HPC |
| **S3 Glacier** | Archive | Long-term backup, compliance |

### S3 Storage Classes

| Class | Availability | Min Duration | Retrieval | Use Case |
|-------|-------------|--------------|-----------|----------|
| Standard | 99.99% | None | ms | Frequent access |
| Intelligent-Tiering | 99.9% | 30 days | ms | Unknown access |
| Standard-IA | 99.9% | 30 days | ms | Infrequent access |
| One Zone-IA | 99.5% | 30 days | ms | Non-critical, infrequent |
| Glacier Instant | 99.9% | 90 days | ms | Archive, instant access |
| Glacier Flexible | 99.99% | 90 days | 1-5h | Archive |
| Glacier Deep Archive | 99.99% | 180 days | 12-48h | Long-term archive |

## Databases

| Service | Type | Engine | Use Case |
|---------|------|--------|----------|
| **RDS** | Managed SQL | PostgreSQL, MySQL, MariaDB, SQL Server, Oracle | Traditional apps |
| **Aurora** | Cloud-native SQL | MySQL/PostgreSQL compatible | High performance, scale |
| **DynamoDB** | NoSQL (KV/Document) | Proprietary | Massive scale, low latency |
| **ElastiCache** | In-memory | Redis, Memcached | Caching, sessions |
| **DocumentDB** | Document | MongoDB compatible | MongoDB workloads |
| **Neptune** | Graph | Property graph, RDF | Knowledge graphs, fraud |
| **Keyspaces** | Wide-column | Cassandra compatible | Time-series, IoT |
| **Timestream** | Time-series | Purpose-built | IoT, monitoring |
| **Qldb** | Ledger | Immutable journal | Audit trails, supply chain |

### RDS/Aurora Features

- **Multi-AZ**: Synchronous standby for HA
- **Read Replicas**: Async replicas for read scaling (up to 15)
- **Aurora Global Database**: Cross-region reads, <1s replication
- **Proxy**: Connection pooling, failover handling
- **Blue/Green Deployments**: Safe upgrades

## Networking

| Service | Purpose |
|---------|---------|
| **VPC** | Isolated network |
| **Subnet** | AZ-scoped IP range |
| **Internet Gateway** | VPC ↔ Internet |
| **NAT Gateway** | Private subnet → Internet |
| **VPC Endpoints** | Private access to AWS services |
| **Transit Gateway** | Hub-spoke VPC connectivity |
| **Direct Connect** | Dedicated network to AWS |
| **VPN** | Encrypted site-to-site |
| **Route 53** | DNS, health checks, traffic routing |
| **CloudFront** | CDN, edge caching |
| **ALB** | Layer 7 load balancing |
| **NLB** | Layer 4, ultra-low latency |
| **CLB** | Legacy (avoid) |
| **Global Accelerator** | Anycast IP, improved latency |

### VPC CIDR Blocks

```
VPC:           10.0.0.0/16  (65,536 IPs)
Public Subnet: 10.0.1.0/24  (256 IPs)  × 3 AZs
Private Subnet: 10.0.10.0/24 (256 IPs) × 3 AZs
Database Subnet: 10.0.20.0/24 (256 IPs) × 3 AZs
Reserved:      10.0.255.0/24 (future)
```

## Security

| Service | Purpose |
|---------|---------|
| **IAM** | Users, groups, roles, policies |
| **STS** | Temporary credentials |
| **Organizations** | Multi-account management |
| **KMS** | Key management, encryption |
| **Secrets Manager** | Rotate, manage secrets |
| **Parameter Store** | Config, secrets (free tier) |
| **WAF** | Web application firewall |
| **Shield** | DDoS protection |
| **GuardDuty** | Threat detection |
| **Security Hub** | Centralized security posture |
| **Config** | Resource compliance |
| **CloudTrail** | API audit logs |
| **Macie** | Data discovery, PII detection |

### IAM Policy Structure

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3Read",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ],
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ["10.0.0.0/16"]
        }
      }
    }
  ]
}
```

### Least Privilege Roles

```hcl
# EC2 Instance Profile
resource "aws_iam_role" "ec2_role" {
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "s3_access" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = ["s3:GetObject", "s3:PutObject"]
      Effect = "Allow"
      Resource = "arn:aws:s3:::my-app-bucket/*"
    }]
  })
}
```

## Messaging & Integration

| Service | Pattern | Features |
|---------|---------|----------|
| **SQS** | Queue | Standard (at-least-once), FIFO (exactly-once) |
| **SNS** | Pub/Sub | Fanout, filtering, SMS/email/push |
| **EventBridge** | Event bus | Rules, schemas, SaaS integration |
| **Kinesis** | Streaming | Shards, replay, analytics |
| **MSK** | Kafka | Managed Apache Kafka |
| **MQ** | Message broker | RabbitMQ, ActiveMQ |
| **Step Functions** | Orchestration | Visual workflows, error handling |

### SQS vs SNS vs EventBridge

| Feature | SQS | SNS | EventBridge |
|---------|-----|-----|-------------|
| Pattern | Queue | Pub/Sub | Event bus |
| Ordering | FIFO only | No | No |
| Deduplication | FIFO only | No | No |
| Replay | No | No | Yes (archive) |
| Schema registry | No | No | Yes |
| SaaS partners | No | No | Yes |
| Dead letter queue | Yes | Yes | Yes |
| Filtering | No | Yes | Yes |

## Analytics

| Service | Purpose |
|---------|---------|
| **Athena** | Serverless SQL on S3 |
| **Redshift** | Data warehouse |
| **EMR** | Managed Hadoop/Spark |
| **Glue** | ETL, data catalog |
| **QuickSight** | BI dashboards |
| **OpenSearch** | Log analytics, search |
| **Kinesis Data Analytics** | Real-time SQL on streams |

## DevOps

| Service | Purpose |
|---------|---------|
| **CodeCommit** | Git repos |
| **CodeBuild** | Build/test |
| **CodeDeploy** | Deploy to EC2/ECS/Lambda |
| **CodePipeline** | CI/CD pipelines |
| **CodeArtifact** | Artifact repository |
| **CloudFormation** | IaC (native) |
| **CDK** | IaC (TypeScript/Python/Go) |
| **Systems Manager** | Ops, patching, params |
| **CloudWatch** | Metrics, logs, alarms |
| **X-Ray** | Distributed tracing |

## Containers

```yaml
# ECS Task Definition (Fargate)
family: myapp
networkMode: awsvpc
requiresCompatibilities: [FARGATE]
cpu: "512"
memory: "1024"
executionRoleArn: arn:aws:iam::123456789:role/ecsTaskExecutionRole
taskRoleArn: arn:aws:iam::123456789:role/ecsTaskRole
containerDefinitions:
  - name: app
    image: 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:latest
    portMappings:
      - containerPort: 8000
        protocol: tcp
    environment:
      - name: ENV
        value: production
    secrets:
      - name: DATABASE_URL
        valueFrom: arn:aws:secretsmanager:us-east-1:123456789:secret:myapp/db
    logConfiguration:
      logDriver: awslogs
      options:
        awslogs-group: /ecs/myapp
        awslogs-region: us-east-1
        awslogs-stream-prefix: ecs
    healthCheck:
      command: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 30
      timeout: 5
      retries: 3
```

## Serverless Patterns

### API Gateway + Lambda

```yaml
# SAM Template
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  MyApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Auth:
        DefaultAuthorizer: JwtAuthorizer
        Authorizers:
          JwtAuthorizer:
            FunctionArn: !GetAtt JwtAuthorizerFunction.Arn
  
  GetUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: handlers.get_user
      Runtime: python3.11
      Architectures: [arm64]
      MemorySize: 256
      Timeout: 10
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref UsersTable
      Events:
        GetUser:
          Type: Api
          Properties:
            RestApiId: !Ref MyApi
            Path: /users/{userId}
            Method: get
  
  UsersTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      PrimaryKey:
        Name: userId
        Type: String
```

### Event-Driven Architecture

```
S3 Upload → EventBridge → Lambda (process) → DynamoDB → SNS (notify)
                ↓
         Step Functions (orchestrate)
                ↓
         Lambda (validate) → Lambda (transform) → Lambda (load)
```

## Pricing Models

| Model | Description | Best For |
|-------|-------------|----------|
| **On-Demand** | Pay per second | Unpredictable workloads |
| **Reserved Instances** | 1-3 year commitment, 30-72% off | Steady state |
| **Savings Plans** | Commit to $/hr, flexible | Mixed workloads |
| **Spot** | Bid on spare capacity, up to 90% off | Fault-tolerant, batch |
| **Dedicated Hosts** | Physical server per hour | Licensing, compliance |

## Well-Architected Framework

### 6 Pillars

| Pillar | Focus Areas |
|--------|-------------|
| **Operational Excellence** | Runbooks, monitoring, automation |
| **Security** | IAM, encryption, network protection |
| **Reliability** | HA, disaster recovery, scaling |
| **Performance Efficiency** | Right-sizing, caching, edge |
| **Cost Optimization** | Right-sizing, reserved, spot |
| **Sustainability** | Region selection, serverless, efficiency |

## Common Patterns

### Static Website

```
Route 53 → CloudFront → S3 (static hosting)
                ↓
           WAF (optional)
```

### Three-Tier Web App

```
Route 53 → ALB (public) → EC2/ECS (private) → RDS (private)
                    ↓
              NAT Gateway → Internet (for updates)
```

### Microservices

```
Route 53 → ALB/NLB → ECS/EKS (private subnets)
                    ↓
         Service Mesh (App Mesh) / API Gateway
                    ↓
         DynamoDB / RDS / ElastiCache (private)
```

### Data Lake

```
Sources → Kinesis/Firehose → S3 (raw) → Glue (ETL) → S3 (processed)
                                                    ↓
                                            Athena / Redshift / QuickSight
```

### Disaster Recovery

| Strategy | RPO | RTO | Cost |
|----------|-----|-----|------|
| Backup/Restore | Hours | Hours | $ |
| Pilot Light | Minutes | Hours | $$ |
| Warm Standby | Seconds | Minutes | $$$ |
| Multi-Site Active/Active | Near zero | Near zero | $$$$ |

## CLI Shortcuts

```bash
# Get resource IDs quickly
aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --output text

# S3 sync
aws s3 sync ./dist s3://my-bucket --delete --cache-control max-age=31536000

# CloudWatch logs
aws logs tail /aws/lambda/my-function --follow --format short

# SSM Session Manager (no SSH needed)
aws ssm start-session --target i-1234567890abcdef0

# Parameter Store
aws ssm get-parameter --name /myapp/prod/db_url --with-decryption

# CloudFormation deploy
aws cloudformation deploy --template-file template.yaml --stack-name myapp --parameter-overrides Env=prod
```

## Service Limits (Default)

| Service | Default Limit | Increase? |
|---------|---------------|-----------|
| VPCs per region | 5 | Yes |
| Subnets per VPC | 200 | Yes |
| Security groups per VPC | 2,500 | Yes |
| EC2 instances (running) | Varies by type | Yes |
| Elastic IPs | 5 | Yes |
| RDS instances | 40 | Yes |
| Lambda concurrent | 1,000 | Yes |
| S3 buckets | 100 | Yes |
| CloudFormation stacks | 200 | Yes |

## Cost Optimization Checklist

- [ ] Enable Compute Savings Plans
- [ ] Delete unattached EBS volumes
- [ ] Delete old snapshots
- [ ] Enable S3 Intelligent-Tiering
- [ ] Delete unused Elastic IPs
- [ ] Right-size EC2/RDS instances
- [ ] Use Spot for fault-tolerant workloads
- [ ] Enable RDS Proxy for connection pooling
- [ ] Use Lambda instead of idle EC2
- [ ] Clean up old CloudWatch log groups
- [ ] Review NAT Gateway usage
- [ ] Use VPC Endpoints for S3/DynamoDB