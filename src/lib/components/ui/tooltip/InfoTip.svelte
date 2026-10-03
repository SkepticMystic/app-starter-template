<script lang="ts">
  import type { MaybeSnippet } from "#lib/interfaces/svelte/svelte.type.js";
  import Icon from "../icon/Icon.svelte";
  import Tip from "./Tip.svelte";

  /**
   * The small "i" beside a figure's label that says what the figure means. A `<button>`, so it
   * takes focus and the explanation reaches a keyboard — the `title` on a `<dt>` it replaces
   * reached neither a keyboard nor a touch screen. The pattern `CallQuality`'s metric strip
   * set; it opens at once, since nobody points at an info icon by accident.
   */

  let {
    label,
    content,
    side = "top",
  }: {
    /** What the figure is called: the button is "About {label}". */
    label: string;
    content: MaybeSnippet;
    side?: "top" | "right" | "bottom" | "left";
  } = $props();
</script>

<Tip
  {content}
  {side}
  delay={0}
  content_class="max-w-72 text-left"
>
  {#snippet child({ props })}
    <button
      {...props}
      type="button"
      class="
        rounded-full text-muted-foreground
        hover:text-foreground
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
      "
      aria-label="About {label}"
    >
      <Icon
        icon="lucide/info"
        class="size-3"
      />
    </button>
  {/snippet}
</Tip>
