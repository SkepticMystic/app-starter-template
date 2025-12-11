import type { Snippet } from "svelte";
import type { UseClipboard } from "../../../hooks/use-clipboard.svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { WithChildren, WithoutChildren } from "bits-ui";
import type { ButtonSize, ButtonVariant } from "../button/button.svelte";

export type CopyButtonPropsWithoutHTML = WithChildren<{
  size?: ButtonSize;
  variant?: ButtonVariant;
  ref?: HTMLButtonElement | null;
  text: string;
  icon?: Snippet<[]>;
  animationDuration?: number;
  onCopy?: (status: UseClipboard["status"]) => void;
}>;

export type CopyButtonProps = CopyButtonPropsWithoutHTML &
  WithoutChildren<HTMLAttributes<HTMLButtonElement>>;
