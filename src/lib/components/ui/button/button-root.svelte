<script
  lang="ts"
  module
>
  import { type WithElementRef } from "#lib/utils/shadcn.util.js";
  import type {
    HTMLAnchorAttributes,
    HTMLButtonAttributes,
  } from "svelte/elements";
  import { tv, type VariantProps } from "tailwind-variants";

  /**
   * shadcn-svelte's `button`, as the registry ships it, with `cn` swapped for a
   * class array. Keep it that way: what this app adds to a button — `icon`,
   * `label`, `loading` — lives in `button.svelte`, so this file can be diffed
   * against (and re-copied from) upstream. The variants marked "ours" are the only
   * deliberate departure.
   */
  export const buttonVariants = tv({
    base: `
      inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm
      font-medium whitespace-nowrap transition-all outline-none
      focus-visible:border-ring focus-visible:ring-[3px]
      focus-visible:ring-ring/50
      disabled:pointer-events-none disabled:opacity-50
      aria-disabled:pointer-events-none aria-disabled:opacity-50
      aria-invalid:border-destructive aria-invalid:ring-destructive/20
      dark:aria-invalid:ring-destructive/40
      [&_svg]:pointer-events-none [&_svg]:shrink-0
      [&_svg:not([class*='size-'])]:size-4
    `,
    variants: {
      variant: {
        default: `
          bg-primary text-primary-foreground shadow-xs
          hover:bg-primary/90
        `,
        destructive: `
          bg-destructive text-white shadow-xs
          hover:bg-destructive/90
          focus-visible:ring-destructive/20
          dark:bg-destructive/60
          dark:focus-visible:ring-destructive/40
        `,
        outline: `
          border bg-background shadow-xs
          hover:bg-accent hover:text-accent-foreground
          dark:border-input dark:bg-input/30
          dark:hover:bg-input/50
        `,
        // NOTE: Ours. The button that *opens* a destructive confirm — Delete in a page header,
        // Leave on a settings row. Solid `destructive` is kept for the confirm's own action, so
        // the red fill means "this is the click that does it".
        "destructive-outline": `
          border border-destructive/40 bg-background text-destructive shadow-xs
          hover:bg-destructive/10
          focus-visible:ring-destructive/20
          dark:bg-input/30
          dark:hover:bg-destructive/20
        `,
        secondary: `
          bg-secondary text-secondary-foreground shadow-xs
          hover:bg-secondary/80
        `,
        ghost: `
          hover:bg-accent hover:text-accent-foreground
          dark:hover:bg-accent/50
        `,
        link: `
          text-primary underline-offset-4
          hover:underline
        `,
        // NOTE: Ours, after `destructive`'s pattern
        warning: `
          bg-warning text-warning-foreground shadow-xs
          hover:bg-warning/90
          focus-visible:ring-warning/20
          dark:bg-warning/60
          dark:focus-visible:ring-warning/40
        `,
        success: `
          bg-success text-success-foreground shadow-xs
          hover:bg-success/90
          focus-visible:ring-success/20
          dark:bg-success/60
          dark:focus-visible:ring-success/40
        `,
        accent: `
          bg-accent text-accent-foreground shadow-xs
          hover:bg-accent/90
          focus-visible:ring-accent/20
          dark:bg-accent/60
          dark:focus-visible:ring-accent/40
        `,
        // NOTE: Ours. No look at all, for a trigger that styles itself.
        none: "",
      },
      size: {
        default: `
          h-9 px-4 py-2
          has-[>svg]:px-3
        `,
        sm: `
          h-8 gap-1.5 rounded-md px-3
          has-[>svg]:px-2.5
        `,
        lg: `
          h-10 rounded-md px-6
          has-[>svg]:px-4
        `,
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        // NOTE: Ours
        /** A link that sits in running text: no box, so nothing to override. */
        inline: "h-auto gap-1.5 rounded-md p-0",
        "icon-xs": `
          size-6 rounded-md
          [&_svg:not([class*='size-'])]:size-3
        `,
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  });

  export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
  export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant;
      size?: ButtonSize;
    };
</script>

<script lang="ts">
  let {
    class: className,
    variant = "default",
    size = "default",
    ref = $bindable(null),
    href = undefined,
    type = "button",
    disabled,
    children,
    ...restProps
  }: ButtonProps = $props();
</script>

{#if href}
  <a
    bind:this={ref}
    data-slot="button"
    class={[buttonVariants({ variant, size }), className]}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? "link" : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={[buttonVariants({ variant, size }), className]}
    {type}
    {disabled}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}
