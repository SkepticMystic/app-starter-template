import { APP } from "#lib/const/app.const.js";
import type { LayoutLoad } from "./$types";

export const load = (({ url, data }) => {
  const href = new URL(url.pathname, url.origin).href;

  // TODO: replace with a dedicated 1200x630 og image (e.g. /og-image.png) for social sharing.
  const image = {
    type: "image/png",
    alt: APP.NAME + " Logo",
    url: APP.URL + APP.LOGO,
    secureUrl: APP.URL + APP.LOGO,
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

      locale: "en_ZA",
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
