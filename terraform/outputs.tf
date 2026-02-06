output "access_key_id" {
  description = "AWS access key ID for EAS Hosting secrets"
  value       = aws_iam_access_key.bedrock_api.id
}

output "secret_access_key" {
  description = "AWS secret access key for EAS Hosting secrets"
  value       = aws_iam_access_key.bedrock_api.secret
  sensitive   = true
}
