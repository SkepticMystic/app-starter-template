<script lang="ts">
  import type { User } from "better-auth";
  import type { AvatarRootProps } from "bits-ui";
  import Avatar from "./avatar.svelte";

  let {
    user,
    ...rest
  }: AvatarRootProps & { user: Pick<User, "name" | "email" | "image"> } =
    $props();

  const label = user.name ?? user.email;
</script>

<Avatar
  {...rest}
  title={label}
  src={user.image}
  alt="{label} avatar"
  fallback={label.at(0) ?? "?"}
/>
