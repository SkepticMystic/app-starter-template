<script lang="ts">
  import type { SelectOption } from "$lib/interfaces";
  import type {
    DataTableFilter,
    DataTableFilterValue,
  } from "$lib/interfaces/tanstack/table.type";
  import { TableFilters } from "$lib/utils/tanstack/table_filter.util";
  import Button from "../button/button.svelte";
  import DateRangePicker from "../date-range-picker/DateRangePicker.svelte";
  import Field from "../field/Field.svelte";
  import NativeSelect from "../native-select/native-select.svelte";
  import MultiSelect from "../select/MultiSelect.svelte";
  import DataTableToolbarSearch from "./data-table-toolbar-search.svelte";

  /** Every control that narrows the table, in one `<search>` landmark. It renders declarations rather than owning
   * state, which is what lets one descriptor list drive a client table and a server one alike. */

  let {
    filters = [],
    values,
    facets,
    filtering,
    global_search,
    debounce_ms = 0,
    onchange,
    onclear,
  }: {
    filters?: DataTableFilter[];

    /** Each control's current value, keyed by `filter.id`. */
    values: Record<string, unknown>;

    /** Options for the `multi` controls that declared none, keyed by `filter.id` —
     * derived from the column's own values. */
    facets?: Record<string, SelectOption<string>[]>;

    /** Whether anything at all is narrowing the table right now — including the global search, which is not in
     * `values` because it belongs to no column. Decided by the caller for exactly that reason. */
    filtering: boolean;

    /** What a `search` descriptor waits, when it does not say for itself. Zero on
     * a client table, which filters an array already in memory. */
    debounce_ms?: number;

    /** The one box over every column that opted in with `enableGlobalFilter`. */
    global_search?: {
      placeholder: string;
      value: string;
      onchange: (value: string) => void;
    };

    onchange: (filter: DataTableFilter, value: DataTableFilterValue) => void;
    onclear: () => void;
  } = $props();
</script>

{#snippet control(filter: DataTableFilter, props: Record<string, unknown>)}
  {#if filter.kind === "search"}
    <DataTableToolbarSearch
      {...props}
      class="max-w-xs"
      value={TableFilters.text_value(values[filter.id])}
      placeholder={filter.placeholder}
      debounce_ms={filter.debounce_ms ?? debounce_ms}
      on_value_change={(value) => onchange(filter, value)}
    />
  {:else if filter.kind === "select"}
    <NativeSelect
      {...props}
      options={TableFilters.select_options(filter.options, filter.all_label)}
      bind:value={
        () => TableFilters.select_value(values[filter.id]),
        (value) => onchange(filter, value)
      }
    />
  {:else if filter.kind === "date_range"}
    <DateRangePicker
      {...props}
      max_days={filter.max_days}
      placeholder={filter.placeholder}
      value={TableFilters.range_value(values[filter.id])}
      onchange={(range) => onchange(filter, range)}
    />
  {:else if filter.kind === "custom"}
    <!-- `props` forwarded like every other arm: it carries `Field`'s `id`, and a `custom` filter that declares a
         `label` without it renders a `<label for>` pointing at no element. -->
    {@render filter.control({
      props,
      value: values[filter.id],
      set: (value) => onchange(filter, value),
    })}
  {:else}
    <MultiSelect
      {...props}
      options={filter.options ?? facets?.[filter.id] ?? []}
      placeholder={filter.placeholder ?? "Any"}
      bind:value={
        () => TableFilters.multi_value(values[filter.id]),
        (value) => onchange(filter, value)
      }
    />
  {/if}
{/snippet}

{#if global_search || filters.length || filtering}
  <search class="flex flex-wrap items-end gap-2">
    {#if global_search}
      <DataTableToolbarSearch
        icon="lucide/search"
        class="max-w-xs"
        value={global_search.value}
        placeholder={global_search.placeholder}
        on_value_change={global_search.onchange}
      />
    {/if}

    {#each filters as filter (filter.id)}
      {#if filter.label}
        <!-- `w-auto` because `Field` is built for a form column, where full width is right; here it is one
             control in a wrapping row, and a 100%-wide item takes a line of its own. Capped so a long
             option cannot push the rest of the row off, and `gap-1.5` to keep the row toolbar-height. -->
        <Field
          label={filter.label}
          class="w-auto max-w-xs gap-1.5"
        >
          {#snippet input({ props })}
            {@render control(filter, props)}
          {/snippet}
        </Field>
      {:else}
        {@render control(filter, {})}
      {/if}
    {/each}

    {#if filtering}
      <Button
        icon="lucide/x"
        variant="ghost"
        onclick={onclear}
      >
        Clear
      </Button>
    {/if}
  </search>
{/if}
