<script lang="ts">
  import { EMAIL_STYLE } from "../email.theme.js";

  let { name }: { name: string | null | undefined } = $props();

  const trimmed = $derived(name?.trim());
</script>

<p style={EMAIL_STYLE.p}>{trimmed ? `Hi ${trimmed},` : "Hi,"}</p>
