<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  let {
    size,
    bg = false,
    class: klass,
  }: {
    bg?: boolean;
    // NOTE: Seems to matter that the variable is called `class`,
    // even tho we use the ClassValue type, intellisense breaks if we rename it
    class: ClassValue;
    size?: `size-${number}`;
  } = $props();
</script>

<!-- These values are configurable in the iconify/tailwind plugin, found in app.css -->
<span class="{bg ? 'icon-bg' : 'icon'} {size} {klass}"></span>
