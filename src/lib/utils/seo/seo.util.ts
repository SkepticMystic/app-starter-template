import { APP } from "$lib/const/app.const";
import { transformUrl } from "unpic";
import { Url } from "../urls";

type UTMData = {
  /**
   * Identifies the source of the traffic, such as a search engine or newsletter.
   * utm_source=google
   */
  source?: string;
  /**
   * Identifies search terms.
   * utm_term=running+shoes */
  term?: string;
  /**
   * Identifies what type of link was used, such as email or pay-per-click advertising.
   * utm_medium=ppc
   */
  medium?: string;
  /**
   * Identifies what specifically was clicked to bring the user to the site, such as a banner ad or a text link. It is often used for A/B testing and content-targeted ads.
   * utm_content=textlink
   */
  content?: string;
  /**
   * Identifies a specific product promotion or strategic campaign.
   * utm_campaign=spring_sale
   */
  campaign?: string;
};

const utmify = (href: string | URL, params: UTMData) => {
  const url = Url.safe(href);
  if (!url) return href.toString();

  const resolved = {
    utm_term: params.term,
    utm_medium: params.medium,
    utm_content: params.content,
    utm_campaign: params.campaign,
    utm_source: params.source ?? APP.DOMAIN,
  };

  return Url.add_search(url, resolved).toString();
};

const transform = (input: NonNullable<App.PageData["seo"]>): NonNullable<App.PageData["seo"]> => {
  const title = input.title?.trim();

  const description = input.description;

  const images = input.openGraph?.images?.map((img) => ({
    width: 1200,
    height: 630,

    ...img,

    url:
      transformUrl({
        url: img.url,
        format: "auto",
        quality: "auto",
        width: img.width || 1200,
        height: img.height || 630,
      }) || img.url,
  }));

  return Object.freeze({
    ...input,

    title,
    description,

    twitter: {
      ...input.twitter,
      title,
      description,

      image: input.twitter?.image || images?.[0]?.url,
    },

    openGraph: {
      ...input.openGraph,
      title,
      images,
      description,
    },
  });
};

export const SEOUtil = {
  utmify,
  transform,
};
