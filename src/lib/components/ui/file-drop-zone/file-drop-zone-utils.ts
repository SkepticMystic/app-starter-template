/**
 * The pure half of the file-drop-zone, kept out of `index.ts` deliberately.
 *
 * `format_bytes` is imported by server code (`image.remote.ts`,
 * `image.service.ts`) and by the component itself. While it lived in the barrel
 * alongside `export { FileDropZone }`, both of those pulled a Svelte component
 * into their module graph — and the component importing the barrel back for
 * `format_bytes` closed a genuine `import/no-cycle`.
 *
 * Nothing here may import a `.svelte` file.
 */

// Working with file sizes.
export const BYTE = 1;
export const KILOBYTE = 1024;
export const MEGABYTE = 1024 * KILOBYTE;
export const GIGABYTE = 1024 * MEGABYTE;

// Limiting accepted files.
export const ACCEPT_IMAGE = "image/*";
export const ACCEPT_VIDEO = "video/*";
export const ACCEPT_AUDIO = "audio/*";

export const format_bytes = (bytes: number): string => {
  if (bytes < KILOBYTE) return `${bytes.toFixed(0)} B`;

  if (bytes < MEGABYTE) return `${(bytes / KILOBYTE).toFixed(0)} KB`;

  if (bytes < GIGABYTE) return `${(bytes / MEGABYTE).toFixed(0)} MB`;

  return `${(bytes / GIGABYTE).toFixed(0)} GB`;
};
