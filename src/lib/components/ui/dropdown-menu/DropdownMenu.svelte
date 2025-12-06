<script lang="ts">
  import type { ButtonVariant } from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { cn } from "$lib/utils/shadcn.util";
  import type { ClassValue } from "svelte/elements";
  import Anchor from "../anchor/Anchor.svelte";
  import Button, { type ButtonSize } from "../button/button.svelte";
  import DropdownMenuContent from "./dropdown-menu-content.svelte";
  import DropdownMenuGroup from "./dropdown-menu-group.svelte";
  import DropdownMenuItem from "./dropdown-menu-item.svelte";
  import DropdownMenuLabel from "./dropdown-menu-label.svelte";
  import DropdownMenuRoot from "./dropdown-menu-root.svelte";
  import DropdownMenuSeparator from "./dropdown-menu-separator.svelte";
  import DropdownMenuTrigger from "./dropdown-menu-trigger.svelte";
  import type { DropdownMenuItemInput } from "./dropdown-menu.types";

  let {
    size,
    items,
    label,
    loading,
    variant = "ghost",
    title = "Actions",
    icon = "lucide/ellipsis",
  }: {
    icon?: string;
    label?: string;
    title?: string;
    loading?: boolean;
    size?: ButtonSize;
    variant?: ButtonVariant;
    items: DropdownMenuItemInput[];
  } = $props();
</script>

{#snippet item_snippet(item: DropdownMenuItemInput)}
  {#if item.kind === "separator"}
    <DropdownMenuSeparator />
  {:else if !item.kind || item.kind === "item"}
    {@const {
      icon,
      title,
      href,
      target,
      hide,
      onselect,
      kind: _kind,
      ...rest
    } = item}

    {#if !hide}
      {#if href}
        <DropdownMenuItem {...rest}>
          {#snippet child({ props })}
            <Anchor
              {...props}
              {href}
              {icon}
              {target}
              class={cn(
                "font-normal no-underline",
                props.class as ClassValue | undefined,
              )}
            >
              {title}
            </Anchor>
          {/snippet}
        </DropdownMenuItem>
      {:else}
        <DropdownMenuItem
          {...rest}
          onSelect={async () => {
            loading = true;
            await onselect?.();
            loading = false;
          }}
        >
          <Icon
            {icon}
            label={title}
          />
        </DropdownMenuItem>
      {/if}
    {/if}
  {:else if item.kind === "group"}
    <DropdownMenuGroup>
      <DropdownMenuLabel>{item.title}</DropdownMenuLabel>

      {#each item.items as subaction, i (i)}
        {@render item_snippet(subaction)}
      {/each}
    </DropdownMenuGroup>
  {/if}
{/snippet}

<DropdownMenuRoot>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button
        {...props}
        {icon}
        {size}
        {label}
        {title}
        {variant}
        {loading}
      />
    {/snippet}
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    {#each items as item, i (i)}
      {@render item_snippet(item)}
    {/each}
  </DropdownMenuContent>
</DropdownMenuRoot>
