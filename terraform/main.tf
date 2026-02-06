terraform {
  required_version = ">= 1.0"

  backend "s3" {
    key    = "react-native-array-layout/terraform.tfstate"
    region = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# IAM user for EAS Hosting API routes to call Bedrock
resource "aws_iam_user" "bedrock_api" {
  name = "eas-bedrock-api"
  tags = {
    Project = "react-native-array-layout"
    Purpose = "EAS Hosting Bedrock access"
  }
}

resource "aws_iam_access_key" "bedrock_api" {
  user = aws_iam_user.bedrock_api.name
}

# Minimal policy: only InvokeModel on Claude models
resource "aws_iam_user_policy" "bedrock_invoke" {
  name = "bedrock-invoke-claude"
  user = aws_iam_user.bedrock_api.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ]
      Resource = [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-*",
        "arn:aws:bedrock:*::inference-profile/us.anthropic.claude-*",
        "arn:aws:bedrock:*:${data.aws_caller_identity.current.account_id}:inference-profile/us.anthropic.claude-*"
      ]
    }]
  })
}
