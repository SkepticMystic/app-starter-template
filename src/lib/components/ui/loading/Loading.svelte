<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import Icon from "../icon/Icon.svelte";

  interface Props {
    title?: string;
    class?: ClassValue;
    loading: boolean | undefined;
    children?: Snippet;
  }

  let { title, loading, class: klass = "", children }: Props = $props();
</script>

{#snippet icon()}
  <Icon icon="lucide/loader-2" class="animate-spin {klass}" />
{/snippet}

{#if loading}
  {#if title}
    <span class="flex items-center gap-2">
      {@render icon()}
      <span>{title}</span>
    </span>
  {:else}
    {@render icon()}
  {/if}
{:else}
  {@render children?.()}
{/if}
