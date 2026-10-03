<script
  lang="ts"
  module
>
  import type { MaybeSnippet } from "#lib/interfaces/svelte/svelte.type.js";
  import type { TipProps } from "../tooltip/Tip.svelte";
  import type { ButtonProps as ButtonRootProps } from "./button-root.svelte";

  export type ButtonProps = ButtonRootProps & {
    /** An Iconify class (`lucide/plus`), drawn before the content. */
    icon?: string | null;
    /** The content, when there are no children. */
    label?: string;
    /** Swaps `icon` for a spinner and disables the button. */
    loading?: boolean;
    /**
     * A tooltip: its content, or `Tip`'s props where it needs more (`kbd`, `side`,
     * `disabled_trigger`). An icon-only button with no `aria-label` of its own is
     * named by it, which is `Tip`'s `names_trigger`, worked out here.
     */
    tip?: MaybeSnippet | Omit<TipProps, "child"> | null;
  };
</script>

<script lang="ts">
  import { mergeProps } from "bits-ui";
  import Icon from "../icon/Icon.svelte";
  import Loading from "../loading/Loading.svelte";
  import Tip from "../tooltip/Tip.svelte";
  import ButtonRoot from "./button-root.svelte";

  /**
   * `button-root.svelte` plus the four props this app puts on nearly every
   * button. Anything this does not suit can use the root directly — it takes the
   * same `variant`, `size`, `href` and `ref`.
   */

  let {
    ref = $bindable(null),
    size = "default",
    disabled,
    icon,
    label,
    loading,
    tip,
    onclick,
    children,
    ...rest_props
  }: ButtonProps = $props();

  /**
   * While an `onclick` that returned a promise is still running, so an async
   * handler gets a spinner without threading a `loading` flag of its own.
   *
   * Its own state rather than a write to `loading`: assigning a prop overrides
   * the caller's value until the caller next changes it, so a handler that
   * settled before the caller's own work did used to clear a spinner the caller
   * still wanted. A handler that returns nothing — a bits-ui trigger's, a
   * toggle's — leaves it alone, so those buttons are never disabled mid-click.
   */
  let pending = $state(false);
  const busy = $derived(Boolean(loading) || pending);

  /**
   * `trigger_click` is the tip trigger's own `onclick`, which closes the tip on a
   * key press, as its `pointerdown` already does for a pointer. It runs first, as
   * `mergeProps` runs every other handler the two share.
   */
  async function click(e: MouseEvent, trigger_click?: unknown) {
    (trigger_click as ((e: MouseEvent) => void) | undefined)?.(e);

    // A caller's `onclick` has to accept a button's event *and* an anchor's, and
    // is handed whichever the root rendered. TS can only call that overload pair
    // with one of the two, hence the cast.
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

  const icon_only = $derived(Boolean(icon) && !children && !label);

  // An icon and nothing else is an icon button, unless it was given another size.
  const resolved_size = $derived(
    size === "default" && icon_only ? "icon" : size,
  );

  const tip_props = $derived(
    typeof tip === "string" || typeof tip === "function"
      ? { content: tip }
      : tip,
  );
</script>

<!-- `trigger` is null without a tip. With one, `mergeProps` rather than two spreads, so a
     caller's handler — a dialog trigger's, when the button opens one — is chained after the
     tip's instead of replacing it. Otherwise the caller's attributes win. -->
{#snippet button(trigger: Record<string, unknown> | null)}
  <ButtonRoot
    {...trigger ? mergeProps(trigger, rest_props) : rest_props}
    bind:ref
    size={resolved_size}
    disabled={disabled || busy}
    aria-busy={busy || undefined}
    onclick={(e: MouseEvent) => click(e, trigger?.onclick)}
  >
    <Loading loading={busy}>
      <Icon {icon} />
    </Loading>

    {#if children}
      {@render children()}
    {:else if label}
      {label}
    {/if}
  </ButtonRoot>
{/snippet}

{#if tip_props?.content}
  <Tip
    names_trigger={icon_only && rest_props["aria-label"] == null}
    {...tip_props}
  >
    {#snippet child({ props })}
      {@render button(props)}
    {/snippet}
  </Tip>
{:else}
  {@render button(null)}
{/if}
