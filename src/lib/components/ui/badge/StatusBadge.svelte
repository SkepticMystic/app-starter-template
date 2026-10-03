<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import Badge from "./badge.svelte";
  import type { BadgeStatus } from "./index.js";

  let {
    status,
    class: klass,
  }: {
    /** A status map's entry, e.g. `TASKS.STATUS.MAP[task.status]`. */
    status: BadgeStatus;
    class?: ClassValue;
  } = $props();

  // A filled badge's dot takes its text colour; on an outline one, the brand's.
  const dot_colour = $derived(
    status.variant === "outline" || status.variant === "secondary"
      ? "bg-primary"
      : "bg-current",
  );
</script>

<!-- Every status badge, in a table cell or a page header, so a status reads the same everywhere. -->
<Badge
  variant={status.variant}
  class={[
    status.cue === "draft" && "border-dashed text-muted-foreground",
    klass,
  ]}
>
  {#if status.cue === "live"}
    <span
      class={[
        "size-1.5 animate-pulse rounded-full motion-reduce:animate-none",
        dot_colour,
      ]}
      aria-hidden="true"
    ></span>
  {/if}

  {status.label}
</Badge>
