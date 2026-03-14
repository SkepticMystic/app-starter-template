<script lang="ts">
  import type { AvatarRootProps } from "bits-ui";
  import Avatar from "./avatar.svelte";

  let {
    user,
    ...rest
  }: AvatarRootProps & {
    user: {
      email: string;
      name?: string | null | undefined;
      image?: string | null | undefined;
    };
  } = $props();

  const label = $derived(user.name || user.email);
</script>

<Avatar
  {...rest}
  title={label}
  src={user.image}
  alt="{label} avatar"
  fallback={label.at(0) || "?"}
/>
