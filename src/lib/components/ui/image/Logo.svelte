<script lang="ts">
  import { APP } from "$lib/const/app.const";

  let { size = "size-7" }: { size?: `size-${number}` } = $props();
</script>

<img
  class={size}
  src={APP.LOGO}
  alt="{APP.NAME} Logo"
/>
