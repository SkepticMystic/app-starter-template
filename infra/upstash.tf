resource "upstash_redis_database" "main" {
  # NOTE: Change in future if the project warrents its own instance
  database_name = "the-free-one"

  region         = "global"
  primary_region = var.upstash_region

  # TLS required for production use
  tls = true

  # noeviction: never evict keys — appropriate for session storage
  eviction = false
}
