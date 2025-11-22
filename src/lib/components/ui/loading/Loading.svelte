<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import Spinner from "../spinner/spinner.svelte";

  interface Props {
    title?: string;
    class?: ClassValue;
    loading: boolean | undefined;
    children?: Snippet;
  }

  let { loading, children, ...props }: Props = $props();
</script>

{#if loading}
  <Spinner {...props} />
{:else}
  {@render children?.()}
{/if}
