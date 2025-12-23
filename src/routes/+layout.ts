import { APP } from "$lib/const/app.const";
import type { LayoutLoad } from "./$types";

export const load = (({ url }) => {
  const href = new URL(url.pathname, url.origin).href;

  const image = {
    type: "image/svg+xml",
    alt: APP.NAME + " Logo",
    url: APP.URL + APP.LOGO,
    secureUrl: APP.URL + APP.LOGO,
  };

  const title = APP.NAME;

  const base_seo = Object.freeze({
    title,
    titleTemplate: "%s | " + APP.NAME,
    description: APP.DESCRIPTION,

    canonical: href,

    openGraph: {
      title,
      url: href,
      type: "website", // ?

      locale: "en_ZA",
      images: [image],
      siteName: APP.NAME, // ?
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
    base_seo,
  };
}) satisfies LayoutLoad;
