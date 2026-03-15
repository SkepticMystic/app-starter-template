import Button from "$lib/components/ui/button/Button.svelte";
import type { WithChildren, WithoutChildren } from "bits-ui";
import type { ComponentProps, Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UseClipboard } from "../../../hooks/use-clipboard.svelte";

export type CopyButtonPropsWithoutHTML = Pick<ComponentProps<typeof Button>, "size" | "variant"> &
  WithChildren<{
    ref?: HTMLButtonElement | null;
    text: string;
    icon?: Snippet<[]>;
    animationDuration?: number;
    onCopy?: (status: UseClipboard["status"]) => void;
  }>;

export type CopyButtonProps = CopyButtonPropsWithoutHTML &
  WithoutChildren<HTMLAttributes<HTMLButtonElement>>;
