# Terraform & Ansible

Infrastructure as Code tools — Terraform for provisioning, Ansible for configuration management.

## Terraform Concepts
- **Declarative**: Define desired state in `.tf` files, Terraform figures out how to reach it. HCL (HashiCorp Configuration Language)
- **Providers**: Plugins for cloud APIs — AWS, Azure, GCP, Kubernetes, GitHub, etc. `required_providers` block to specify sources/versions
- **Resources**: `resource "aws_instance" "web" { ami = "ami-..." instance_type = "t2.micro" }` — what to create and its config
- **Data sources**: `data "aws_ami" "ubuntu" { ... }` — query existing infrastructure, use in resource configs
- **Variables**: `variable "region" { type = string default = "us-east-1" }` — input values. `terraform.tfvars` for assigning values
- **Outputs**: `output "instance_ip" { value = aws_instance.web.public_ip }` — expose values after apply
- **State**: `terraform.tfstate` — JSON mapping resources to real infrastructure. Critical — store remotely (S3, Terraform Cloud). Never edit manually
- **Plan & Apply**: `terraform plan` (preview changes) → `terraform apply` (execute). Destroy: `terraform destroy`

## Terraform Workflow
- **Modules**: Reusable configurations — `module "vpc" { source = "./modules/vpc" }`. Use registry modules (terraform-aws-modules/vpc/aws). Module = directory with inputs/variables + outputs
- **Workspaces**: `terraform workspace new prod` — separate state for environments (dev/staging/prod). Alternative: directory structure with different backends
- **Remote state**: Backend config — `backend "s3" { bucket = "my-state" key = "prod/network.tfstate" region = "us-east-1" dynamodb_table = "terraform-locks" }`. DynamoDB for state locking
- **Expressions**: `count` (multiple identical resources), `for_each` (map/list variants), `for` expressions (transform lists), conditionals `condition ? true_val : false_val`
- **Lifecycle rules**: `lifecycle { create_before_destroy = true prevent_destroy = true ignore_changes = [tags] }` — control update behavior
- **Sensitive values**: `sensitive = true` on variables/outputs — prevents display in CLI output

## Ansible Concepts
- **Agentless**: SSH-based (Linux) or WinRM (Windows). No client software on target machines. Push-based (vs pull for Puppet/Chef)
- **Playbooks**: YAML files — `- hosts: webservers tasks: - name: Install nginx apt: name: nginx state: present` — ordered tasks
- **Modules**: Idempotent units — `apt`, `yum`, `copy`, `template`, `service`, `command`, `file`, `git`, `docker_container`. 1000+ built-in
- **Inventory**: Define target hosts — INI or YAML. `[webservers] web1.example.com web2.example.com`. Static or dynamic (from cloud API)
- **Variables**: In playbook, `vars/` directory, group/host vars, `--extra-vars`. Precedence: extra-vars > playbook > inventory > defaults
- **Templates**: Jinja2 — `template: src=nginx.conf.j2 dest=/etc/nginx/nginx.conf`. Variables: `{{ server_name }}`. Logic: `{% if %} ... {% endif %}`
- **Roles**: Organized structure — `roles/nginx/tasks/main.yml`, `roles/nginx/templates/`, `roles/nginx/vars/`, `roles/nginx/handlers/`. Handlers = tasks triggered by notify (restart service when config changes)
- **Tags**: `tags: [install, configure]` — run subsets: `ansible-playbook site.yml --tags install`

## Ansible Galaxy
- **Community roles**: `ansible-galaxy install geerlingguy.nginx` — reusable roles from community
- **Collections**: Bundles of roles, modules, plugins — `collections: - name: community.docker`
- **Molecule**: Testing framework for Ansible roles — converge, verify (testinfra), lint. CI/CD for infrastructure

## Terraform + Ansible Together
- **Terraform provisions infrastructure**: Creates VPC, subnets, instances, load balancers, databases
- **Ansible configures software on provisioned machines**: Install packages, deploy apps, manage config files
- **Pass data**: Terraform outputs → `terraform output -json` → Ansible inventory. Or use Terraform template to generate inventory. Example: `terraform output -json instance_ips | jq -r '.[]' > hosts.ini`

## State Management & Security
- **Terraform**: Store state in remote backend (S3 + DynamoDB lock). Encrypt state at rest. Use workspaces for env separation. Back up state
- **Ansible**: Vault — `ansible-vault encrypt vars/secrets.yml`. Encrypts variables (passwords, API keys). `--ask-vault-pass` at run time
- **Secrets**: Never hardcode — use Vault, AWS Secrets Manager, HashiCorp Vault, or SSM Parameter Store. Terraform `data.aws_secretsmanager_secret`

## Common Commands
- **Terraform**: `init` (download providers, init backend), `fmt` (format code), `validate` (syntax check), `plan` (diff), `apply` (execute), `destroy` (tear down), `import` (bring existing resource under management), `state list` (show resources), `taint` (mark for recreation)
- **Ansible**: `ansible all -m ping` (check connectivity), `ansible-playbook site.yml` (run playbook), `ansible-lint` (check YAML), `ansible-inventory --list` (show hosts), `ansible-doc -l | grep docker` (find module)
