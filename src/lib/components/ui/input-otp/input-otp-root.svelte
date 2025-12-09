<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util.js";
  import { PinInput as InputOTPPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    value = $bindable(""),
    ...restProps
  }: InputOTPPrimitive.RootProps = $props();
</script>

<InputOTPPrimitive.Root
  bind:ref
  bind:value
  data-slot="input-otp"
  class={cn(
    "flex items-center gap-2 has-disabled:opacity-50 [&_input]:disabled:cursor-not-allowed",
    className,
  )}
  {...restProps}
/>
