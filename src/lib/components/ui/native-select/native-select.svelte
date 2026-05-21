<script
  lang="ts"
  generics="V"
>
  import type { MaybePromise, SelectOption } from "$lib/interfaces";
  import { type WithElementRef } from "$lib/utils/shadcn.util.js";
  import type { HTMLSelectAttributes } from "svelte/elements";
  import Skeleton from "../skeleton/skeleton.svelte";
  import NativeSelectOption from "./native-select-option.svelte";
  import NativeSelectRoot from "./native-select-root.svelte";

  let {
    options,
    children,
    on_value_select,
    value = $bindable(),
    ...restProps
  }: WithElementRef<HTMLSelectAttributes> & {
    value?: V;
    options?: MaybePromise<SelectOption<V>[]>;
    on_value_select?: (value: V) => MaybePromise<unknown>;
  } = $props();
</script>

{#snippet inner(awaited: Awaited<typeof options>)}
  <NativeSelectRoot
    bind:value={
      () => (value === undefined ? "" : value),
      (v) => (value = v === "" ? undefined : v)
    }
    onchange={(_) => on_value_select?.(value)}
    {...restProps}
  >
    {@render children?.()}

    {#each awaited ?? [] as option (option.value)}
      <NativeSelectOption
        value={option.value}
        disabled={option.disabled}
      >
        {option.label}
      </NativeSelectOption>
    {/each}
  </NativeSelectRoot>
{/snippet}

{#if options instanceof Promise}
  <svelte:boundary>
    {@const awaited = await options}

    {#snippet pending()}
      <Skeleton class={["h-9", restProps.class]} />
    {/snippet}

    {@render inner(awaited)}
  </svelte:boundary>
{:else}
  {@render inner(options)}
{/if}
