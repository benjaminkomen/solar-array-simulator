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
    Statement = [
      {
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
      },
      {
        Effect = "Allow"
        Action = [
          "rekognition:DetectText"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Group for Bedrock model invocation logging
resource "aws_cloudwatch_log_group" "bedrock_logs" {
  name              = "/aws/bedrock/model-invocations"
  retention_in_days = 7

  tags = {
    Project = "react-native-array-layout"
    Purpose = "Bedrock model invocation logging"
  }
}

# IAM role for Bedrock to write to CloudWatch
resource "aws_iam_role" "bedrock_logging" {
  name = "bedrock-cloudwatch-logging"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "bedrock.amazonaws.com"
      }
      Action = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
        ArnLike = {
          "aws:SourceArn" = "arn:aws:bedrock:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
        }
      }
    }]
  })

  tags = {
    Project = "react-native-array-layout"
  }
}

resource "aws_iam_role_policy" "bedrock_logging" {
  name = "cloudwatch-logs-write"
  role = aws_iam_role.bedrock_logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "${aws_cloudwatch_log_group.bedrock_logs.arn}:*"
    }]
  })
}

# Enable Bedrock model invocation logging
resource "aws_bedrock_model_invocation_logging_configuration" "main" {
  logging_config {
    embedding_data_delivery_enabled = true
    image_data_delivery_enabled     = true
    text_data_delivery_enabled      = true

    cloudwatch_config {
      log_group_name = aws_cloudwatch_log_group.bedrock_logs.name
      role_arn       = aws_iam_role.bedrock_logging.arn
    }
  }
}
