<script lang="ts">
  import { box } from "svelte-toolbelt";
  import { usePassword } from "./password.svelte.js";
  import type { PasswordRootProps } from "./types.js";

  let {
    class: className,
    ref = $bindable(null),
    hidden = $bindable(true),
    children,
  }: PasswordRootProps = $props();

  usePassword({
    hidden: box.with(
      () => hidden,
      (v) => (hidden = v),
    ),
  });
</script>

<div
  bind:this={ref}
  class={["flex flex-col gap-2", className]}
>
  {@render children?.()}
</div>
