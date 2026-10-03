<script lang="ts">
  import CardRoot from "../card/card-root.svelte";
  import ErrorState from "./ErrorState.svelte";

  let {
    title,
    description,
    retry,
  }: {
    title: string;
    description?: string;
    /** For a boundary, its `reset`; for a section of a load, a re-run of the load. */
    retry: () => void;
  } = $props();
</script>

<!-- One card's read failed and the rest of the page stands. -->
<CardRoot>
  <ErrorState
    {title}
    {description}
    {retry}
    class="md:p-6"
  />
</CardRoot>
