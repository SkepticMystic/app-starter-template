export const IMAGES = {
  SIZES: {
    // Matches size-4 of Icon.svelte
    ICON: {
      width: 16,
      height: 16,
    },
    AVATAR: {
      width: 32,
      height: 32,
    },
    THUMBNAIL: {
      width: 180,
      height: 180,
    },
    PREVIEW: {
      width: 270,
      height: 270,
    },
    FULL: {
      width: 800,
      height: 800,
    },
  } satisfies Record<string, { width: number; height: number }>,
};
