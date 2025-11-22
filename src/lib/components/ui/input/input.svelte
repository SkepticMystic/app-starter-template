<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util.js";
  import type { ComponentProps } from "svelte";
  import Icon from "../icon/Icon.svelte";
  import InputRoot from "./input-root.svelte";

  let {
    icon,
    ref = $bindable(null),
    value = $bindable(),
    class: klass,
    ...restProps
  }: ComponentProps<typeof InputRoot> & {
    icon?: string;
  } = $props();
</script>

{#snippet input(snippet_class?: string)}
  <InputRoot
    bind:ref
    bind:value
    class={cn(klass, snippet_class)}
    {...restProps}
  />
{/snippet}

{#if icon}
  <div class="relative">
    {@render input("peer pe-9")}

    <!-- SOURCE: https://github.com/EpicAlbin03/shadcn-studio-svelte/blob/main/src/lib/components/shadcn-studio/input/input-15.svelte -->
    <div
      class="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground peer-disabled:opacity-50"
    >
      <Icon
        {icon}
        class="size-4"
      />

      <span class="sr-only">{icon.split("/").at(-1)}</span>
    </div>
  </div>
{:else}
  {@render input()}
{/if}
