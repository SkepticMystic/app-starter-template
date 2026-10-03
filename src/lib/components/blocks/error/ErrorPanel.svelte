<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import FeedbackModal from "#lib/components/blocks/feedback/FeedbackModal.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import ErrorState, {
    error_copy,
  } from "#lib/components/ui/error-state/ErrorState.svelte";
  import type { ClassValue } from "svelte/elements";

  let {
    home,
    class: klass,
  }: {
    /** Where "Go home", and "Go back" with no history, lead. */
    home: string;
    /** The card's width and placement, which is its frame's. */
    class?: ClassValue;
  } = $props();

  const copy = $derived(error_copy(page.status, page.error?.message));

  // History, not the URL's parent: the page before this one is where the reader came from. A tab
  // opened straight onto the error has none, so it goes home instead of doing nothing.
  const back = () => (history.length > 1 ? history.back() : goto(home));
</script>

<!-- The body of both `+error.svelte`s; each brings only its frame. -->
<div class={["rounded-xl border bg-card shadow-sm", klass]}>
  <ErrorState
    icon={copy.icon}
    title={copy.title}
    description={copy.description}
  >
    {#snippet actions()}
      <Button
        variant="outline"
        icon="lucide/arrow-left"
        onclick={back}
      >
        Go back
      </Button>
      <Button
        href={home}
        icon="lucide/house"
      >
        Go home
      </Button>
    {/snippet}
  </ErrorState>
</div>

{#if page.status >= 500}
  <div class="flex justify-center">
    <FeedbackModal />
  </div>
{/if}
