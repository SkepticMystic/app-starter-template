<script lang="ts">
  import type { User } from "$lib/server/db/models/auth.model";
  import type { AvatarRootProps } from "bits-ui";
  import Avatar from "./avatar.svelte";

  let { user, ...rest }: AvatarRootProps & { user: User } = $props();

  const label = user.name || user.email;
</script>

<Avatar
  {...rest}
  title={label}
  src={user.image}
  alt="{label} avatar"
  fallback={label.at(0) || "?"}
/>
