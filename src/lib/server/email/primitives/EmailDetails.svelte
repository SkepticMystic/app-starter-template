<script lang="ts">
  import { EMAIL_COLOR as C } from "../email.theme.js";

  let {
    rows,
  }: {
    /** A row with no value is left out, so a caller can pass what it might not have. */
    rows: { label: string; value: string | null | undefined }[];
  } = $props();

  const shown = $derived(rows.filter((row) => row.value));
</script>

<table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="margin:0 0 16px;border-collapse:collapse;"
>
  <tbody>
    {#each shown as row (row.label)}
      <tr>
        <!-- `data-label`: the plain-text part reads this row as "Label: value". -->
        <td
          data-label
          class="email-muted"
          style="width:96px;padding:6px 16px 6px 0;vertical-align:top;white-space:nowrap;font-size:14px;color:{C.muted};"
          >{row.label}</td
        >
        <td
          style="padding:6px 0;vertical-align:top;font-size:14px;word-break:break-word;"
          >{row.value}</td
        >
      </tr>
    {/each}
  </tbody>
</table>
