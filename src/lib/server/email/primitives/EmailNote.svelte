<script lang="ts">
  import type { Snippet } from "svelte";
  import { EMAIL_COLOR as C } from "../email.theme.js";

  let { children }: { children: Snippet } = $props();
</script>

<!-- A warning set apart from the body: what to do if the reader did not ask for this. -->
<p
  class="email-note"
  style="margin:0 0 16px;padding:12px 16px;border-left:4px solid {C.warning_border};border-radius:4px;background-color:{C.warning_bg};color:{C.warning_ink};font-size:14px;line-height:1.5;"
>
  {@render children()}
</p>
