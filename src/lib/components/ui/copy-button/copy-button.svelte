<script lang="ts">
  import { UseClipboard } from "$lib/hooks/use-clipboard.svelte";
  import { cn } from "$lib/utils/shadcn.util";
  import Button from "../button/button.svelte";
  import Icon from "../icon/Icon.svelte";
  import type { CopyButtonProps } from "./types";

  let {
    text,
    icon,
    animationDuration = 500,
    variant = "outline",
    onCopy,
    class: className,
    tabindex = -1,
    children,
    ...rest
  }: CopyButtonProps = $props();

  const clipboard = new UseClipboard();
</script>

<Button
  {...rest}
  {variant}
  {tabindex}
  class={cn("flex items-center gap-2", className)}
  type="button"
  name="copy"
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
      <span class="sr-only">Copy</span>
    </div>
  {/if}

  {@render children?.()}
</Button>
