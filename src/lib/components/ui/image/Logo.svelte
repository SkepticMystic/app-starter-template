<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import type { ClassValue } from "svelte/elements";

  let {
    size = "size-7",
    show_name = false,
    class: klass,
  }: {
    size?: `size-${number}`;
    /** The name beside the mark. Off where the surrounding control already says it. */
    show_name?: boolean;
    class?: ClassValue;
  } = $props();
</script>

<!--
  Inline rather than an `<img>` of the favicon, so the mark takes the theme's `--primary` in
  light and dark alike. The geometry is `static/favicon.svg`'s; keep the two in step.
-->
<span class={["inline-flex items-center gap-2", klass]}>
  <svg
    class={["shrink-0", size]}
    viewBox="0 0 64 64"
    role="img"
    aria-label={show_name ? undefined : APP.NAME}
    aria-hidden={show_name ? "true" : undefined}
  >
    <rect
      width="64"
      height="64"
      rx="14"
      class="fill-primary"
    />
    <rect
      x="15"
      y="15"
      width="22"
      height="22"
      class="fill-primary-foreground opacity-60"
    />
    <rect
      x="27"
      y="27"
      width="22"
      height="22"
      class="fill-primary-foreground"
    />
  </svg>

  {#if show_name}
    <span class="font-semibold tracking-tight">{APP.NAME}</span>
  {/if}
</span>
