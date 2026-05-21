import type { WithChildren, WithoutChildren } from "bits-ui";
import type { ComponentProps, Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UseClipboard } from "../../../hooks/use-clipboard.svelte";
import type Button from "../button/button.svelte";

export type CopyButtonPropsWithoutHTML = Partial<
  Pick<ComponentProps<typeof Button>, "size" | "variant">
> &
  WithChildren<{
    ref?: HTMLButtonElement | null;
    text: string;
    icon?: Snippet;
    animationDuration?: number;
    onCopy?: (status: UseClipboard["status"]) => void;
  }>;

export type CopyButtonProps = CopyButtonPropsWithoutHTML &
  WithoutChildren<HTMLAttributes<HTMLButtonElement>>;
