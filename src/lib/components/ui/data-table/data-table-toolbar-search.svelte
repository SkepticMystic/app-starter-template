<script lang="ts">
  import { debounce } from "$lib/utils/timer.util";
  import { onDestroy } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import Input from "../input/input.svelte";

  /** NOTE: `HTMLInputAttributes` rather than `ComponentProps<typeof Input>`, and `on_value_change` rather than
   * `onchange`: `Input`'s props are a union `Omit` cannot distribute over, and `onchange` would intersect, not replace. */
  let {
    value,
    debounce_ms = 0,
    on_value_change,
    on_input,
    ...rest
  }: Omit<
    HTMLInputAttributes,
    "type" | "files" | "value" | "oninput" | "onchange"
  > & {
    value: string;
    icon?: string;
    /** See `DataTableFilter`'s `search` variant. Zero writes on every keystroke. */
    debounce_ms?: number;
    on_value_change: (value: string) => void;
    /** Every keystroke, undebounced — for copy that keeps up with the typing rather than with the query. The roster's
     * "term too short" warning and its Clear are about what is in the box; `on_value_change` is the write. */
    on_input?: (value: string) => void;
  } = $props();

  /** What the box shows, which is not always what the table has been told. Bound immediately so typing stays
   * responsive: an input showing the *sent* value would swallow characters the debounce has not written yet. */
  let echo = $state(value);

  /** The last value that arrived from outside, so the effect can tell "the caller changed this under us" from "our
   * own write came back". Not `$state`, and never touched on input — that would make a pending value look external. */
  let last_external = value;

  $effect(() => {
    if (value === last_external) return;

    last_external = value;
    echo = value;
  });

  /** Created once rather than `$derived`: rebuilding it would drop the timer the keystroke before it waits on. */
  const debounced = debounce(
    (next: string) => on_value_change(next),
    // Trailing edge, which `debounce` is unconditionally — we want the term the user
    // stopped on, not the first letter they pressed.
    debounce_ms,
  );

  // A pending write must not reach a table the user has already left.
  onDestroy(() => debounced.cancel());

  const handle_input = (next: string) => {
    echo = next;
    on_input?.(next);

    // Zero means "no delay", not "defer by a tick". A client table filters an array already in memory, and
    // routing that through a timer would land the first keystroke after the render that should have shown it.
    if (debounce_ms > 0) debounced(next);
    else on_value_change(next);
  };
</script>

<Input
  {...rest}
  type="text"
  value={echo}
  oninput={(e) => handle_input(e.currentTarget.value)}
/>
