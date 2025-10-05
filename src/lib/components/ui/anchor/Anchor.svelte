<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils/shadcn.util";
  import type { ClassValue, HTMLAnchorAttributes } from "svelte/elements";
  import Icon from "../icon/Icon.svelte";
  import Loading from "../loading/Loading.svelte";

  let {
    href,
    icon,
    loading,
    disabled,
    children,
    class: klass,
    ref = $bindable(null),
    ...rest_props
  }: WithElementRef<HTMLAnchorAttributes> & {
    icon?: ClassValue;
    loading?: boolean;
    disabled?: boolean | null;
  } = $props();
</script>

<a
  class:loading
  aria-disabled={disabled || loading}
  href={disabled || loading ? undefined : href}
  role={disabled || loading ? "link" : undefined}
  tabindex={disabled || loading ? -1 : undefined}
  class={cn(
    // NOTE: Copied from buttonVariants.variant === 'link'
    // But we don't take the rest cause then it forces the `size` classes on us
    "inline-block underline underline-offset-4",
    // Mine
    "font-medium",
    klass,
  )}
  bind:this={ref}
  {...rest_props}
>
  <span class="flex items-center gap-1.5">
    <Loading {loading} />

    <Icon {icon} />

    {@render children?.()}
  </span>
</a>
