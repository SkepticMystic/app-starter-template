<script lang="ts" generics="TData extends Item">
  import Icon from "$lib/components/icons/Icon.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
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
        title: string;
        icon?: ClassValue;
        onselect: (row: Row<TData>) => void;
        disabled?: (row: Row<TData>) => boolean;
      } & Omit<DropdownMenuItemPropsWithoutHTML, "onSelect" | "disabled">);

  let {
    row,
    actions,
  }: {
    row: Row<TData>;
    actions: Action[];
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
      onSelect={() => onselect(row)}
    >
      <Icon {icon} />

      {title}
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
        size="icon"
        variant="ghost"
        class="relative size-8 p-0"
      >
        <Icon icon="lucide/ellipsis" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>

  <DropdownMenu.Content>
    {#each actions as action}
      {@render action_snippet(action, row)}
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
