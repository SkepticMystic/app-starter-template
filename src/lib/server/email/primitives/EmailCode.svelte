<script lang="ts">
  import { EMAIL_COLOR as C, EMAIL_FONT } from "../email.theme.js";

  let { code }: { code: string } = $props();
</script>

<p
  class="email-subtle"
  style="margin:24px 0;padding:16px;text-align:center;border-radius:8px;background-color:{C.subtle};font-family:{EMAIL_FONT.mono};font-size:28px;font-weight:600;letter-spacing:6px;"
>
  {code}
</p>
