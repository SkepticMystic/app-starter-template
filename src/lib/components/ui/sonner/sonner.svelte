<script lang="ts">
  import { mode } from "mode-watcher";
  import {
    Toaster as Sonner,
    type ToasterProps as SonnerProps,
  } from "svelte-sonner";
  import Icon from "../icon/Icon.svelte";

  let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
  theme={mode.current}
  class="toaster group"
  style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
  {...restProps}
  richColors
  closeButton={true}
  duration={10_000}
>
  {#snippet loadingIcon()}
    <Icon
      icon="lucide/loader-2"
      class="size-5 animate-spin"
    />
  {/snippet}

  {#snippet successIcon()}
    <Icon
      icon="lucide/check"
      class="size-5"
    />
  {/snippet}

  {#snippet errorIcon()}
    <Icon
      icon="lucide/x"
      class="size-5"
    />
  {/snippet}

  {#snippet infoIcon()}
    <Icon
      icon="lucide/info"
      class="size-5"
    />
  {/snippet}

  {#snippet warningIcon()}
    <Icon
      icon="lucide/alert-triangle"
      class="size-5"
    />
  {/snippet}
</Sonner>
