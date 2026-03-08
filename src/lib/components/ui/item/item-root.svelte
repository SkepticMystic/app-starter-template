<script
  lang="ts"
  module
>
  import { tv, type VariantProps } from "tailwind-variants";

  export const itemVariants = tv({
    base: `
      group/item flex flex-wrap items-center rounded-md border
      border-transparent text-sm transition-colors duration-100 outline-none
      focus-visible:border-ring focus-visible:ring-[3px]
      focus-visible:ring-ring/50
      [a]:transition-colors
      [a]:hover:bg-accent/50
    `,
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
        destructive:
          "text-destructive-foreground border-destructive/50 bg-destructive/30",
      },
      size: {
        default: "gap-4 p-4",
        sm: "gap-2.5 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  });

  export type ItemSize = VariantProps<typeof itemVariants>["size"];
  export type ItemVariant = VariantProps<typeof itemVariants>["variant"];
</script>

<script lang="ts">
  import { type WithElementRef } from "$lib/utils/shadcn.util.js";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    child,
    variant,
    size,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    child?: Snippet<[{ props: Record<string, unknown> }]>;
    variant?: ItemVariant;
    size?: ItemSize;
  } = $props();

  const mergedProps = $derived({
    class: [itemVariants({ variant, size }), className],
    "data-slot": "item",
    "data-variant": variant,
    "data-size": size,
    ...restProps,
  });
</script>

{#if child}
  {@render child({ props: mergedProps })}
{:else}
  <div
    bind:this={ref}
    {...mergedProps}
  >
    {@render mergedProps.children?.()}
  </div>
{/if}
