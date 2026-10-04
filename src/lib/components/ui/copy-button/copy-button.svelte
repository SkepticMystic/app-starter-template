<script lang="ts">
  import { UseClipboard } from "#lib/hooks/use-clipboard.svelte.js";
  import Button from "../button/button.svelte";
  import Icon from "../icon/Icon.svelte";
  import type { CopyButtonProps } from "./types.js";

  let {
    text,
    icon,
    size,
    variant = "outline",
    onCopy,
    class: className,
    children,
    ...rest
  }: CopyButtonProps = $props();

  const clipboard = new UseClipboard();
</script>

<Button
  {...rest}
  {size}
  {variant}
  class={["flex items-center gap-2", className]}
  type="button"
  onclick={async () => {
    const status = await clipboard.copy(text);

    onCopy?.(status);
  }}
>
  {#if clipboard.status === "success"}
    <div>
      <Icon
        icon="lucide/check"
        tabindex={-1}
      />
      <span class="sr-only">Copied</span>
    </div>
  {:else if clipboard.status === "failure"}
    <div>
      <Icon
        icon="lucide/x"
        tabindex={-1}
      />
      <span class="sr-only">Failed to copy</span>
    </div>
  {:else}
    <div>
      {#if icon}
        {@render icon()}
      {:else}
        <Icon
          icon="lucide/copy"
          tabindex={-1}
        />
      {/if}
      <!-- Only when the button has no visible text, or it would read "Copy Copy". -->
      {#if !children}
        <span class="sr-only">Copy</span>
      {/if}
    </div>
  {/if}

  {@render children?.()}
</Button>
