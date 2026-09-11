<script lang="ts">
  import { RangeCalendar as RangeCalendarPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: RangeCalendarPrimitive.GridRowProps = $props();
</script>

<RangeCalendarPrimitive.GridRow
  bind:ref
  class={["flex", className]}
  {...restProps}
/>
