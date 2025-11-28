<script lang="ts">
  import type { MaybePromise } from "$lib/interfaces";
  import type { Snippet } from "svelte";
  import ButtonGroup from "../button-group/button-group.svelte";
  import Button from "../button/button.svelte";

  // const LIMIT_VALUES = [10, 20, 50, 100, 500] as const;

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

  let page = $derived(Math.floor(skip / limit));
  /** The highest page index (zero-based) */
  let last_page = $derived(total ? Math.ceil(total / limit) - 1 : null);
</script>

<ButtonGroup class="rounded-lg! border border-border">
  <!-- <Button
    title="First"
    disabled={disabled || page === 0}
    variant="ghost"
    icon="lucide/chevrons-left"
    onclick={() => set_skip(0)}
  ></Button> -->

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

  <!--
  {#if last_page !== null}
    <Button
      title="Last"
      disabled={disabled || page === last_page || !has_more}
      variant="ghost"
      icon="lucide/chevrons-right"
      onclick={() => set_skip(last_page * limit!)}
    ></Button>
  {/if} -->

  <!-- <ButtonGroupSeparator />

  <NativeSelect
    {disabled}
    class="w-fit border-0 pr-7"
    bind:value={limit}
  >
    {#each LIMIT_VALUES as value (value)}
      <NativeSelectOption {value}>{value}</NativeSelectOption>
    {/each}
  </NativeSelect> -->

  {@render children?.()}
</ButtonGroup>
