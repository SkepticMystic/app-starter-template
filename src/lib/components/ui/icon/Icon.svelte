<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util";
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  let {
    icon,
    label,
    bg = false,
    class: klass = "",
    ...rest
  }: HTMLAttributes<SVGElement> & {
    bg?: boolean;
    label?: string;
    class?: ClassValue;
    icon?: string | null;
  } = $props();
</script>

{#snippet icon_snippet()}
  <svg
    class={cn(bg ? "icon-bg" : "icon", icon, "size-4", klass)}
    {...rest}
  ></svg>
{/snippet}

{#if icon && label}
  <span class="flex items-center gap-1.5">
    {@render icon_snippet()}
    {label}
  </span>
{:else if icon}
  {@render icon_snippet()}
{:else if label}
  {label}
{/if}
