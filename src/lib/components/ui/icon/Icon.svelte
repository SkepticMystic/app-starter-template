<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util";
  import type { ClassValue } from "svelte/elements";

  let {
    icon,
    label,
    title,
    bg = false,
    class: klass = "",
  }: {
    bg?: boolean;
    label?: string;
    title?: string;
    icon?: ClassValue;
    class?: ClassValue;
  } = $props();
</script>

{#if icon}
  {#snippet inner()}
    <span {title} class={cn(bg ? "icon-bg" : "icon", icon, "size-4", klass)}
    ></span>
  {/snippet}

  {#if label}
    <span class="flex items-center gap-1.5">
      {@render inner()}
      {label}
    </span>
  {:else}
    {@render inner()}
  {/if}
{/if}
