<script lang="ts" generics="TData extends Item">
  import Icon from "$lib/components/icons/Icon.svelte";
  import {
    Button,
    type ButtonVariant,
  } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import type { Item } from "$lib/utils/items.util";
  import type { Row } from "@tanstack/table-core";
  import type { ClassValue } from "svelte/elements";

  type Action =
    | {
        kind: "separator";
      }
    | {
        kind: "item";
        title: string;
        icon?: ClassValue;
        variant?: ButtonVariant;
        onclick: (row: Row<TData>) => void;
      }
    | {
        kind: "group";
        label: string;
        actions: Action[];
      };

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
    <DropdownMenu.Item onclick={() => action.onclick(row)}>
      <Icon icon={action.icon} />

      {action.title}
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
