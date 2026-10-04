<script lang="ts">
  import { EMAIL_COLOR as C, EMAIL_FONT } from "../email.theme.js";

  let {
    href,
    label,
    variant = "primary",
  }: {
    href: string;
    label: string;
    /** `danger` for an action that destroys something. */
    variant?: "primary" | "danger";
  } = $props();

  const fill = $derived(variant === "danger" ? C.danger : C.accent);
</script>

<!-- The colour is on the cell as well as the link: Outlook ignores a link's padding and
     background but paints a cell's, so it still shows a solid button. -->
<table
  role="presentation"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="margin:24px 0;"
>
  <tbody>
    <tr>
      <td style="border-radius:8px;background-color:{fill};">
        <a
          {href}
          target="_blank"
          data-button
          style="display:inline-block;padding:12px 22px;font-family:{EMAIL_FONT.sans};font-size:15px;font-weight:600;line-height:1.2;color:{C.on_accent};text-decoration:none;border-radius:8px;"
          >{label}</a
        >
      </td>
    </tr>
  </tbody>
</table>
