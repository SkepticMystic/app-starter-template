variable "team_id" {
  description = "Vercel team id."
  type        = string
}

variable "project_name" {
  description = "Vercel project name."
  type        = string
}

variable "github_repo" {
  description = "GitHub repo (owner/name) to connect for git deploys."
  type        = string
}

variable "app_env" {
  description = "The application environment manifest from the root module. See infra/app_env.tf."
  type = map(object({
    key       = string
    value     = string
    targets   = list(string)
    sensitive = bool
  }))
}
