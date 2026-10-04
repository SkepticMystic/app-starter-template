import type { UseClipboard } from "#lib/hooks/use-clipboard.svelte.js";
import type { WithChildren } from "bits-ui";
import type { ComponentProps, Snippet } from "svelte";
import type Button from "../button/button.svelte";

type ButtonProps = ComponentProps<typeof Button>;

export type CopyButtonPropsWithoutHTML = Partial<
  Pick<ButtonProps, "size" | "variant">
> &
  WithChildren<{
    text: string;
    icon?: Snippet;
    onCopy?: (status: UseClipboard["status"]) => void;
  }>;

/** The rest is handed to `Button`; `type`, `onclick` and the content are the copy button's own. */
export type CopyButtonProps = CopyButtonPropsWithoutHTML &
  Omit<
    ButtonProps,
    keyof CopyButtonPropsWithoutHTML | "type" | "onclick" | "icon" | "label"
  >;
