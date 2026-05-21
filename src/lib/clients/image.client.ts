import { delete_image_remote } from "$lib/remote/image/image.remote";
import type { Image } from "$lib/server/db/models/image.model";
import { thumbHashToDataURL } from "thumbhash";
import { Client } from "./index.client";

export const ImageClient = {
  delete: Client.wrap(delete_image_remote, {
    confirm: "Are you sure you want to delete this image?",
    suc_msg: "Image deleted",
  }),

  // SOURCE: https://github.com/evanw/thumbhash/blob/main/examples/browser/index.html
  decode_thumbhash: (image?: Pick<Image, "thumbhash">) =>
    image?.thumbhash
      ? thumbHashToDataURL(
          new Uint8Array(
            atob(image.thumbhash)
              .split("")
              .map((x) => x.charCodeAt(0)),
          ),
        )
      : undefined,
};
