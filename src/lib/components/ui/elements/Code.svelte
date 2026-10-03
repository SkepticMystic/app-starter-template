<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  let { content, class: klass }: { content: string; class?: ClassValue } =
    $props();
</script>

<!-- A machine value shown as itself — a key prefix, an id — so it reads as a token and
  not as a status badge. A table cell renders it with `renderComponent(Code, { content })`. -->
<code
  class={[
    "rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground",
    klass,
  ]}>{content}</code
>
