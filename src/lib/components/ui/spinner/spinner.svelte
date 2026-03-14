<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Icon from "../icon/Icon.svelte";

  type Props = ComponentProps<typeof Icon>;

  let { class: className, ...restProps }: Props = $props();
</script>

<Icon
  role="status"
  aria-label="Loading"
  icon="lucide/loader-2"
  class={["size-4 animate-spin", className]}
  {...restProps}
/>
