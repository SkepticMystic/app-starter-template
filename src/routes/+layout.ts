import { APP } from "#lib/const/app.const.js";
import { TIME } from "#lib/const/time.const.js";
import type { LayoutLoad } from "./$types";

export const load = (({ url, data }) => {
  const href = new URL(url.pathname, url.origin).href;

  const image = {
    type: "image/png",
    alt: APP.NAME,
    url: APP.URL + APP.OG_IMAGE,
    secureUrl: APP.URL + APP.OG_IMAGE,
    width: 1200,
    height: 630,
  };

  const title = APP.NAME;

  const base_seo = Object.freeze({
    title,
    titleTemplate: `%s · ${APP.NAME}`,
    description: APP.DESCRIPTION,

    robots: "index,follow",

    canonical: href,

    openGraph: {
      title,
      url: href,
      type: "website",

      // Open Graph spells a locale with an underscore.
      locale: TIME.LOCALE.replace("-", "_"),
      images: [image],
      siteName: APP.NAME,
      description: APP.DESCRIPTION,
    },

    twitter: {
      title,
      image: image.url,
      description: APP.DESCRIPTION,
      cardType: "summary_large_image" as const,
    },
  }) satisfies App.PageData["seo"];

  return {
    // Required: a universal load replaces the server load's data rather than merging with it, so
    // `user` and `org` must be spread back, or every `can()` answers `false`.
    ...data,

    base_seo,
  };
}) satisfies LayoutLoad;
