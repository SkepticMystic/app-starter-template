<script
  lang="ts"
  module
>
  import Icon from "#lib/components/ui/icon/Icon.svelte";
  import { type WithElementRef } from "#lib/utils/shadcn.util.js";
  import type {
    HTMLAnchorAttributes,
    HTMLButtonAttributes,
  } from "svelte/elements";
  import { tv, type VariantProps } from "tailwind-variants";

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
        outline: `
            border bg-background shadow-xs
            hover:bg-accent hover:text-accent-foreground
            dark:border-input dark:bg-input/30
            dark:hover:bg-input/50
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
      size?: ButtonSize;
      variant?: ButtonVariant;
      // NOTE: Mine
      label?: string;
      loading?: boolean;
      icon?: string | null;
      href?: string;
    };
</script>

<script lang="ts">
  import Anchor from "../anchor/Anchor.svelte";
  import Loading from "../loading/Loading.svelte";

  let {
    class: klass,
    variant = "default",
    size = "default",
    ref = $bindable(null),
    href = undefined,
    type = "button",
    disabled,
    loading,
    icon,
    label,
    onclick,

    children,
    ...restProps
  }: ButtonProps = $props();

  /**
   * While an `onclick` that returned a promise is still running, so an async
   * handler gets a spinner without threading a `loading` flag of its own.
   *
   * Its own state rather than a write to `loading`: assigning a prop overrides
   * the caller's value until the caller next changes it, so a handler that
   * settled before the caller's own work did would clear a spinner the caller
   * still wanted. A handler that returns nothing — a bits-ui trigger's, a
   * toggle's — leaves it alone, so those buttons are never disabled mid-click.
   */
  let pending = $state(false);
  const busy = $derived(Boolean(loading) || pending);

  async function click(e: MouseEvent) {
    // A caller's `onclick` has to accept a button's event *and* an anchor's.
    // TS can only call that overload pair with one of the two, hence the cast.
    const handler = onclick as ((e: MouseEvent) => unknown) | null | undefined;
    const result = handler?.(e);
    if (!(result instanceof Promise)) return;

    pending = true;
    try {
      await result;
    } finally {
      pending = false;
    }
  }

  // svelte-ignore state_referenced_locally
  if (size === "default" && icon && !children && !label) {
    size = "icon";
  }
</script>

{#if href}
  <Anchor
    {icon}
    {href}
    {loading}
    {disabled}
    {children}
    {onclick}
    class={[buttonVariants({ variant, size }), "no-underline!", klass]}
    data-slot="button"
    bind:ref
    {...restProps}
  />
{:else}
  <button
    {type}
    class={[buttonVariants({ variant, size }), klass]}
    data-slot="button"
    aria-busy={busy || undefined}
    disabled={disabled || busy}
    bind:this={ref}
    {...restProps}
    onclick={click}
  >
    <Loading loading={busy} />
    <Icon {icon} />

    {#if children}
      {@render children()}
    {:else if label}
      {label}
    {/if}
  </button>
{/if}
