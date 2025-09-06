<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  let {
    icon,
    size,
    bg = false,
    class: klass = "",
  }: {
    bg?: boolean;
    icon?: ClassValue;
    class?: ClassValue;
    size?: `size-${number}`;
  } = $props();
</script>

<!-- These values are configurable in the iconify/tailwind plugin, found in app.css -->
{#if icon}
  <span class="{bg ? 'icon-bg' : 'icon'} {icon} {size} {klass}"></span>
{/if}
