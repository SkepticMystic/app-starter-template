<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import Icon from "../icons/Icon.svelte";

  interface Props {
    class?: ClassValue;
    loading: boolean | undefined;
    children?: import("svelte").Snippet;
  }

  let { loading, class: klass = "", children }: Props = $props();
</script>

{#if loading}
  <Icon icon="lucide/loader-2" class="animate-spin {klass}" />
{:else}
  {@render children?.()}
{/if}
