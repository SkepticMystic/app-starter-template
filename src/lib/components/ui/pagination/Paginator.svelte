<script lang="ts">
  import type { MaybePromise } from "#lib/interfaces/index.js";
  import { page_of_offset } from "#lib/utils/tanstack/table_layout.util.js";
  import type { Snippet } from "svelte";
  import ButtonGroup from "../button-group/button-group.svelte";
  import Button from "../button/button.svelte";

  interface Props {
    skip: number | undefined;
    /** Items per page */
    limit: number | undefined;
    /** Total number of items to paginate, or null if not known */
    total?: number | null;
    has_more?: boolean;
    disabled?: boolean;
    onchange?: (skip: number, limit: number) => MaybePromise<unknown>;

    children?: Snippet;
  }

  let {
    skip = $bindable(),
    limit = $bindable(),
    total = null,
    has_more = true,
    disabled = false,
    onchange,
    children,
  }: Props = $props();

  skip ??= 0;
  limit ??= 20;

  const set_skip = (target: number) => {
    if (target < 0 || (total !== null && target >= total)) {
      return;
    }

    skip = target;

    onchange?.(skip, limit!);
  };

  let page = $derived(page_of_offset(skip, limit).pageIndex);
  /** The highest page index (zero-based) */
  let last_page = $derived(total ? Math.ceil(total / limit) - 1 : null);
</script>

<ButtonGroup class="rounded-lg! border border-border">
  <Button
    title="Previous"
    disabled={disabled || page === 0}
    variant="ghost"
    icon="lucide/chevron-left"
    onclick={() => set_skip(skip! - limit!)}
  ></Button>

  <Button
    {disabled}
    title="Reset"
    variant="ghost"
    class="font-bold"
    onclick={() => set_skip(0)}
  >
    {page + 1}{last_page !== null ? " / " + (last_page + 1) : ""}
  </Button>

  <Button
    title="Next"
    variant="ghost"
    icon="lucide/chevron-right"
    disabled={disabled || page === last_page || !has_more}
    onclick={() => set_skip(skip! + limit!)}
  ></Button>

  {@render children?.()}
</ButtonGroup>
