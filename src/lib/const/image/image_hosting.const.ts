const PROVIDER_IDS = ["cloudinary"] as const;

export const IMAGE_HOSTING = {
  PROVIDER: {
    IDS: PROVIDER_IDS,
  },

  LIMITS: {
    MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // Megabytes

    /** Raster formats only: an SVG can carry script, and sharp cannot thumbhash it. */
    MIME: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"],

    MAX_COUNT: {
      PER_RESOURCE: 10,
    },
  },
};
