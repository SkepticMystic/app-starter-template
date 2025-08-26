<script lang="ts">
  import IconChevronDoubleLeft from "~icons/heroicons/chevron-double-left";
  import IconChevronDoubleRight from "~icons/heroicons/chevron-double-right";
  import IconChevronLeft from "~icons/heroicons/chevron-left";
  import IconChevronRight from "~icons/heroicons/chevron-right";

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
  <button
    title="First"
    disabled={disabled || page === 0}
    class="btn join-item btn-square border-0 btn-ghost btn-sm"
    onclick={() => set_skip(0)}
  >
    <IconChevronDoubleLeft />
  </button>

  <button
    title="Previous"
    disabled={disabled || page === 0}
    class="btn join-item btn-square border-0 btn-ghost btn-sm"
    onclick={() => set_skip(filters.skip - filters.limit)}
  >
    <IconChevronLeft />
  </button>

  <button
    {disabled}
    title="Refresh"
    class="btn join-item border-0 font-bold btn-ghost btn-sm"
    onclick={() => set_skip(filters.skip)}
  >
    {page + 1}{last_page !== null ? " / " + (last_page + 1) : ""}
  </button>

  <button
    title="Next"
    class="btn join-item btn-square border-0 btn-ghost btn-sm"
    disabled={disabled || page === last_page || !has_more}
    onclick={() => set_skip(filters.skip + filters.limit)}
  >
    <IconChevronRight />
  </button>

  {#if last_page !== null}
    <button
      title="Last"
      disabled={disabled || page === last_page || !has_more}
      class="btn join-item btn-square border-0 btn-ghost btn-sm"
      onclick={() => set_skip(last_page * filters.limit)}
    >
      <IconChevronDoubleRight />
    </button>
  {/if}

  <select
    title="Items per page"
    class="select join-item border-none select-sm"
    bind:value={filters.limit}
    onchange={() => set_skip(0)}
  >
    {#each [10, 20, 50, 100, 500, 1000, 5000] as value (value)}
      <option {value}>{value}</option>
    {/each}
  </select>
</div>
