<script lang="ts" generics="TData extends Item">
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import type { MaybePromise } from "$lib/interfaces";
  import type { Item } from "$lib/utils/items.util";
  import type { Row } from "@tanstack/table-core";
  import type { DropdownMenuItemPropsWithoutHTML } from "bits-ui";
  import type { ClassValue } from "svelte/elements";

  type Action =
    | {
        kind: "separator";
      }
    | {
        kind: "group";
        label: string;
        actions: Action[];
      }
    | ({
        kind: "item";
        title: string | ((row: Row<TData>) => string);
        icon?: ClassValue | ((row: Row<TData>) => ClassValue);

        disabled?: (row: Row<TData>) => boolean;
        onselect: (row: Row<TData>) => MaybePromise<unknown>;
      } & Omit<DropdownMenuItemPropsWithoutHTML, "onSelect" | "disabled">);

  let {
    row,
    actions,
    loading,
  }: {
    row: Row<TData>;
    actions: Action[];
    loading?: boolean;
  } = $props();
</script>

{#snippet action_snippet(action: Action, row: Row<TData>)}
  {#if action.kind === "separator"}
    <DropdownMenu.Separator />
  {:else if action.kind === "item"}
    {@const { onselect, icon, title, disabled, kind: _kind, ...rest } = action}

    <DropdownMenu.Item
      {...rest}
      disabled={disabled?.(row)}
      onSelect={async () => {
        loading = true;
        await onselect(row);
        loading = false;
      }}
    >
      <Icon icon={typeof icon === "function" ? icon(row) : icon} />

      {typeof title === "function" ? title(row) : title}
    </DropdownMenu.Item>
  {:else if action.kind === "group"}
    <DropdownMenu.Group>
      <DropdownMenu.Label>{action.label}</DropdownMenu.Label>

      {#each action.actions as subaction}
        {@render action_snippet(subaction, row)}
      {/each}
    </DropdownMenu.Group>
  {/if}
{/snippet}

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        {loading}
        variant="ghost"
        icon="lucide/ellipsis"
        class="relative size-8 p-0"
      />
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content>
    {#each actions as action}
      {@render action_snippet(action, row)}
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
