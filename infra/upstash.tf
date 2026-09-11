resource "upstash_redis_database" "main" {
  # WARNING: SHARED INSTANCE, OWNED BY THIS STATE.
  #
  # This name is not this project's — one Upstash instance is shared across
  # projects, and this state owns the resource. So `tofu destroy` here, or a
  # rename of this argument, takes Redis away from everything else using it.
  #
  # All tiers also share it, separated ONLY by the `<APP.ID>:<VERCEL_ENV>:` key
  # prefix that `src/lib/server/db/redis.db.ts` prepends. There is no
  # infrastructure-layer fallback the way there is for Neon (a branch per tier)
  # or R2 (a bucket per tier): get the prefix wrong and dev reads production's
  # sessions.
  #
  # `eviction = false` below compounds it — when the instance fills, writes fail
  # rather than evicting, so another project filling it takes this one's
  # sessions down too.
  #
  # Exit path: give this project its own instance
  # (`database_name = var.project_name`), or move the resource into its own root
  # module and consume it here through a data source.
  database_name = "the-free-one"

  region         = "global"
  primary_region = var.upstash_region

  # TLS required for production use
  tls = true

  # noeviction: never evict keys — appropriate for session storage
  eviction = false
}
