<script lang="ts">
  import { AUTH } from "$lib/const/auth/auth.const.js";
  import { cn } from "$lib/utils/shadcn.util.js";
  import { box } from "svelte-toolbelt";
  import { usePassword } from "./password.svelte.js";
  import type { PasswordRootProps } from "./types.js";

  let {
    class: className,
    ref = $bindable(null),
    hidden = $bindable(true),
    minScore = AUTH.PASSWORD.MIN_SCORE,
    children,
  }: PasswordRootProps = $props();

  usePassword({
    hidden: box.with(
      () => hidden,
      (v) => (hidden = v),
    ),
    minScore: box.with(() => minScore),
  });
</script>

<div
  bind:this={ref}
  class={cn("flex flex-col gap-2", className)}
>
  {@render children?.()}
</div>
