<script lang="ts">
  import { navigating } from "$app/state";

  /** A navigation that settles sooner than this never shows the bar, so a fast one cannot flash. */
  const DELAY_MS = 150;

  let visible = $state(false);

  // Writes `visible` and never reads it, so it cannot re-run itself.
  $effect(() => {
    if (!navigating.to) {
      visible = false;
      return;
    }

    const timer = setTimeout(() => (visible = true), DELAY_MS);
    return () => clearTimeout(timer);
  });
</script>

<!--
  Every page load and every server-paged table's filter, sort or page change waits on a `load`,
  and nothing else says so. Indeterminate, since how long a load will take is unknowable; with
  reduced motion it is a still bar instead of a sweep.
-->
{#if visible}
  <div
    role="progressbar"
    aria-label="Loading page"
    class="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden"
  >
    <div
      class="
        h-full w-1/3 animate-nav-sweep bg-primary
        motion-reduce:w-full motion-reduce:animate-none
      "
    ></div>
  </div>
{/if}
