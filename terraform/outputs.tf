output "access_key_id" {
  description = "AWS access key ID for EAS Hosting secrets"
  value       = aws_iam_access_key.bedrock_api.id
}

output "secret_access_key" {
  description = "AWS secret access key for EAS Hosting secrets"
  value       = aws_iam_access_key.bedrock_api.secret
  sensitive   = true
}

output "bedrock_log_group" {
  description = "CloudWatch Log Group for Bedrock model invocation logs"
  value       = aws_cloudwatch_log_group.bedrock_logs.name
}
