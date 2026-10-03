<script
  lang="ts"
  module
>
  /** Kit's own messages, which say less than the copy below; anything else was written for a reader. */
  const GENERIC = new Set([
    "Not Found",
    "Internal Error",
    "Forbidden",
    "Unauthorized",
  ]);

  /**
   * The message of an error raised on purpose, or `null` for kit's stock wording and a crash's.
   * Not `isHttpError`: a boundary's `failed` receives the transformed `App.Error`, never what was
   * thrown. Not `status` either, as in kit 2: kit 3 gives its own fallback for an unexpected error
   * a status too (`{ status: 500, message: "Internal Error" }`), so the message is the tell.
   */
  export const raised_message = (error: unknown): string | null =>
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message &&
    !GENERIC.has(error.message)
      ? error.message
      : null;

  /**
   * What to say about a failed page load, by status. A message somebody raised on purpose
   * (`error(403, "Only owners can …")`) is kept as the description, since it knows more than a
   * status does; kit's stock wording and a crash's are replaced.
   */
  export const error_copy = (
    status: number,
    message: string | undefined,
  ): { icon: string; title: string; description: string } => {
    const raised = raised_message({ message }) ?? undefined;

    switch (status) {
      case 404:
        return {
          icon: "lucide/file-question",
          title: "Page not found",
          description:
            raised ?? "The page you're looking for doesn't exist or has moved.",
        };
      case 401:
      case 403:
        return {
          icon: "lucide/lock",
          title: "You don't have access",
          description:
            raised ??
            "Your role doesn't include this page. An owner of your organization can change that.",
        };
      case 429:
        return {
          icon: "lucide/timer",
          title: "Too many requests",
          description: raised ?? "Wait a moment, then try again.",
        };
      default:
        return {
          icon: "lucide/triangle-alert",
          title: "Something went wrong",
          description:
            status < 500 && raised
              ? raised
              : "We've been notified. Try again in a moment.",
        };
    }
  };
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import Button from "../button/button.svelte";
  import Empty from "../empty/empty.svelte";

  let {
    title,
    description,
    icon = "lucide/triangle-alert",
    retry,
    actions,
    class: klass,
  }: {
    title: string;
    description?: string;
    icon?: string;
    /** A "Try again" button. For a boundary, its `reset`, which re-runs what failed. */
    retry?: () => void;
    /** Further buttons, after "Try again". */
    actions?: Snippet;
    class?: ClassValue;
  } = $props();
</script>

{#snippet buttons()}
  <div class="flex flex-wrap justify-center gap-2">
    {#if retry}
      <Button
        variant="outline"
        icon="lucide/rotate-ccw"
        onclick={retry}
      >
        Try again
      </Button>
    {/if}

    {@render actions?.()}
  </div>
{/snippet}

<!-- One look for a failure, page-wide or one card's: what failed, why if known, what to do. -->
<Empty
  {icon}
  {title}
  {description}
  content={retry || actions ? buttons : undefined}
  class={klass}
  role="alert"
/>
