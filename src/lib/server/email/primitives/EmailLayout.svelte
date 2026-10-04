<script lang="ts">
  import { asset } from "$app/paths";
  import { APP } from "#lib/const/app.const.js";
  import { App } from "#lib/utils/app.js";
  import type { Snippet } from "svelte";
  import { EMAIL_COLOR as C, EMAIL_FONT, EMAIL_STYLE } from "../email.theme.js";

  let {
    reason = `You're receiving this because of activity on your ${APP.NAME} account.`,
    children,
  }: {
    /** The footer's first line: why this person got this email. */
    reason?: string;
    children: Snippet;
  } = $props();

  // A raster, since Gmail and Outlook do not render SVG. Resolved, since `asset` answers a
  // path unless `paths.assets` points elsewhere.
  const LOGO = new URL(asset("icon-192.png"), APP.URL).href;
</script>

<table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  class="email-page"
  style="background-color:{C.page};"
>
  <tbody>
    <tr>
      <td
        align="center"
        style="padding:32px 12px;"
      >
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="max-width:600px;"
        >
          <tbody>
            <tr>
              <!-- `data-text-skip`: the plain-text part starts at the heading. -->
              <td
                data-text-skip
                style="padding:0 4px 20px;"
              >
                <a
                  href={APP.URL}
                  class="email-ink"
                  style="color:{C.ink};text-decoration:none;font-family:{EMAIL_FONT.sans};font-size:16px;font-weight:600;"
                >
                  <img
                    src={LOGO}
                    width="32"
                    height="32"
                    alt=""
                    style="vertical-align:middle;border-radius:8px;"
                  />
                  <span style="vertical-align:middle;padding-left:8px;"
                    >{APP.NAME}</span
                  >
                </a>
              </td>
            </tr>
            <tr>
              <td
                class="email-card email-ink"
                style="background-color:{C.card};border:1px solid {C.border};border-radius:12px;padding:32px;font-family:{EMAIL_FONT.sans};font-size:16px;line-height:1.6;color:{C.ink};"
              >
                {@render children()}
              </td>
            </tr>
            <tr>
              <td
                class="email-muted"
                style="padding:20px 4px 0;font-family:{EMAIL_FONT.sans};font-size:12px;line-height:1.5;color:{C.muted};"
              >
                <p style="margin:0 0 4px;">{reason}</p>
                <p style="margin:0;">
                  <a
                    href={App.full_url("/settings/account").href}
                    class="email-muted"
                    style="{EMAIL_STYLE.link}color:{C.muted};"
                    >Account settings</a
                  >
                  ·
                  <a
                    href={App.full_url("/contact").href}
                    class="email-muted"
                    style="{EMAIL_STYLE.link}color:{C.muted};">Contact us</a
                  >
                  · {APP.NAME}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
