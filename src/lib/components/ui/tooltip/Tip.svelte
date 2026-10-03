<script
  lang="ts"
  module
>
  import type { MaybeSnippet } from "#lib/interfaces/svelte/svelte.type.js";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  export type TipProps = {
    content: MaybeSnippet;
    kbd?: string | readonly string[];
    names_trigger?: boolean;
    side?: "top" | "right" | "bottom" | "left";
    delay?: number;
    content_class?: ClassValue;
    /** The trigger is a disabled control, and the tip says why. */
    disabled_trigger?: boolean;
    child: Snippet<[{ props: Record<string, unknown> }]>;
  };
</script>

<script lang="ts">
  import ExtractSnippet from "#lib/components/util/ExtractSnippet.svelte";
  import KbdGroup from "../kbd/kbd-group.svelte";
  import Kbd from "../kbd/kbd.svelte";
  import TooltipContent from "./tooltip-content.svelte";
  import TooltipRoot from "./tooltip-root.svelte";
  import TooltipTrigger from "./tooltip-trigger.svelte";

  /**
   * A tooltip on whatever `child` renders — a real one, opened by hover *and* keyboard focus,
   * which a `title` attribute never was. Callers import this and nothing else — and a `Button`
   * does not import even this: it takes the same props as its own `tip`.
   *
   * ```svelte
   * <Tip content="Add a step" names_trigger>
   *   {#snippet child({ props })}
   *     <button {...props} type="button" onclick={add}><Icon icon="lucide/plus" /></button>
   *   {/snippet}
   * </Tip>
   * ```
   *
   * - **Spread `props` first.** bits-ui passes its handlers and ARIA in it; an attribute after
   *   the spread wins, so a later `onclick` is fine and a later `aria-describedby` breaks it.
   * - **`names_trigger`, for an icon-only trigger:** the tip's text becomes its accessible
   *   name. Leave it off where the trigger has words of its own, which must stay its name.
   * - **`kbd` draws the shortcut**; `aria-keyshortcuts` stays the caller's, since a screen
   *   reader wants "Control+Z Meta+Z" where the eye wants "⌘Z".
   * - **A disabled button fires no pointer events and takes no focus**, so its tip never opens.
   *   Pass `disabled_trigger` while it is disabled: the tip moves to a focusable wrapper, and
   *   `child` is handed no props. Where the button is enabled, the same tip sits on it as usual.
   *
   * `delay` is set here rather than left to the provider: inside the app the nearest provider
   * is the sidebar's, at 0ms for its collapsed icons, which would flash a tip at every pass of
   * the mouse over a toolbar.
   */

  let {
    content,
    kbd,
    names_trigger = false,
    side = "top",
    delay = 300,
    content_class,
    disabled_trigger = false,
    // Renamed: the trigger's own `{#snippet child}` below would shadow it.
    child: trigger,
  }: TipProps = $props();

  const keys = $derived(kbd === undefined ? [] : [kbd].flat());
</script>

<TooltipRoot delayDuration={delay}>
  <TooltipTrigger>
    {#snippet child({ props })}
      {#if disabled_trigger}
        <!-- A tab stop on a non-interactive element is the point here: the control inside
          takes no focus, and why it is disabled must still reach a keyboard. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <span
          {...props}
          tabindex="0"
          class="inline-flex"
        >
          {@render trigger({ props: {} })}
        </span>
      {:else}
        {@render trigger({
          props:
            names_trigger && typeof content === "string"
              ? {
                  ...props,
                  "aria-label": content,
                  "aria-describedby": undefined,
                }
              : props,
        })}
      {/if}
    {/snippet}
  </TooltipTrigger>

  <TooltipContent
    {side}
    class={["flex items-center gap-2", content_class]}
  >
    <span><ExtractSnippet snippet={content} /></span>

    {#if keys.length}
      <KbdGroup>
        {#each keys as key (key)}
          <Kbd>{key}</Kbd>
        {/each}
      </KbdGroup>
    {/if}
  </TooltipContent>
</TooltipRoot>
