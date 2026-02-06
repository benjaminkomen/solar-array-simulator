# Terraform — AWS Bedrock IAM

Creates an IAM user with minimal permissions to call Bedrock (Claude) from EAS Hosting API routes.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.0
- AWS CLI configured with credentials that can create IAM resources
- Claude model access enabled in the [AWS Bedrock console](https://console.aws.amazon.com/bedrock/home#/modelaccess) (one-time per account)

## Setup

### 1. Create the S3 state bucket (one-time)

```bash
aws s3api create-bucket \
  --bucket react-native-array-layout-2 \
  --region us-east-1
```

Enable versioning so you can recover previous state files:

```bash
aws s3api put-bucket-versioning \
  --bucket react-native-array-layout-2 \
  --versioning-configuration Status=Enabled
```

### 2. Configure the backend

```bash
cp backend.hcl.example backend.hcl
```

Edit `backend.hcl` and set the bucket name you created above.

### 3. Initialize Terraform

```bash
terraform init -backend-config=backend.hcl
```

### 4. Review changes

```bash
terraform plan
```

### 5. Apply

```bash
terraform apply
```

## Post-apply: set EAS secrets

Retrieve the credentials from Terraform output:

```bash
terraform output access_key_id
terraform output -raw secret_access_key
```

Then store them as EAS secrets:

```bash
eas env:create --name AWS_ACCESS_KEY_ID     --value "..." --environment production --visibility sensitive
eas env:create --name AWS_SECRET_ACCESS_KEY  --value "..." --environment production --visibility sensitive
eas env:create --name AWS_REGION             --value "us-east-1" --environment production --visibility plaintext
```

For local development, pull env vars into a `.env` file:

```bash
eas env:pull --environment development
```

## Resources created

| Resource | Purpose |
|----------|---------|
| `aws_iam_user.bedrock_api` | IAM user `eas-bedrock-api` |
| `aws_iam_access_key.bedrock_api` | Access key for the IAM user |
| `aws_iam_user_policy.bedrock_invoke` | Inline policy allowing `bedrock:InvokeModel` on Claude models |
