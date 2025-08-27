<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  let {
    class: klass,
    bg = false,
  }: {
    // NOTE: Seems to matter that the variable is called `class`,
    // even tho we use the ClassValue type, intellisense breaks if we rename it
    class: ClassValue;
    bg?: boolean;
  } = $props();
</script>

<!-- These values are configurable in the iconify/tailwind plugin, found in app.css -->
<span class="{bg ? 'icon-bg' : 'icon'} {klass}"></span>
