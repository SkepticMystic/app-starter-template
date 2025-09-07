<script lang="ts">
  import Button from "./ui/button/button.svelte";

  interface Props {
    filters: { skip: number; limit: number };

    disabled?: boolean;
    has_more?: boolean;
    /** Total number of items to paginate, or null if not known */
    total?: number | null;

    onchange?: (filters: { skip: number; limit: number }) => void;
  }

  let {
    onchange,
    total = null,
    has_more = true,
    disabled = false,
    filters = $bindable(),
  }: Props = $props();

  const set_skip = (target: number) => {
    if (target < 0 || (total !== null && target >= total)) {
      return;
    }

    filters.skip = target;

    onchange?.(filters);
  };

  let page = $derived(Math.floor(filters.skip / filters.limit));

  /** The highest page index (zero-based) */
  let last_page = $derived(total ? Math.ceil(total / filters.limit) - 1 : null);
</script>

<div class="my-card join flex w-fit p-1.5">
  <Button
    title="First"
    variant="ghost"
    onclick={() => set_skip(0)}
    disabled={disabled || page === 0}
    icon="lucide/chevrons-left"
  />

  <Button
    icon="lucide/chevron-left"
    variant="ghost"
    title="Previous"
    disabled={disabled || page === 0}
    onclick={() => set_skip(filters.skip - filters.limit)}
  />

  <Button
    {disabled}
    title="Refresh"
    variant="ghost"
    onclick={() => set_skip(filters.skip)}
  >
    {page + 1}{last_page !== null ? " / " + (last_page + 1) : ""}
  </Button>

  <Button
    title="Next"
    variant="ghost"
    icon="lucide/chevron-right"
    disabled={disabled || page === last_page || !has_more}
    onclick={() => set_skip(filters.skip + filters.limit)}
  />

  {#if last_page !== null}
    <Button
      title="Last"
      variant="ghost"
      icon="lucide/chevrons-right"
      onclick={() => set_skip(last_page * filters.limit)}
      disabled={disabled || page === last_page || !has_more}
    />
  {/if}

  <select
    title="Items per page"
    class="join-item"
    bind:value={filters.limit}
    onchange={() => set_skip(0)}
  >
    {#each [10, 20, 50, 100, 500, 1000, 5000] as value (value)}
      <option {value}>{value}</option>
    {/each}
  </select>
</div>
