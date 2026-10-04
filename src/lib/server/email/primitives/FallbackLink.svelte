<script lang="ts">
  import { EMAIL_COLOR as C } from "../email.theme.js";

  let { url }: { url: string } = $props();
</script>

<!-- `data-text-skip`: the plain-text part already reads the URL off the button. -->
<p
  data-text-skip
  class="email-muted"
  style="margin:0 0 16px;font-size:13px;line-height:1.5;color:{C.muted};"
>
  Button not working? Paste this link into your browser:<br />
  <a
    href={url}
    style="color:{C.accent};word-break:break-all;">{url}</a
  >
</p>
