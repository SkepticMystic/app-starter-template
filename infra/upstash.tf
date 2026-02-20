resource "upstash_redis_database" "main" {
  database_name = var.project_name

  region         = "global"
  primary_region = var.upstash_region

  # TLS required for production use
  tls = true

  # noeviction: never evict keys — appropriate for session storage
  eviction = false
}
