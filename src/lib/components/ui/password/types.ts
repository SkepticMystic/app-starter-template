import type {
  Meter as MeterPrimitive,
  Toggle as TogglePrimitive,
  WithChildren,
  WithoutChildren,
} from "bits-ui";
import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
import type { CopyButtonProps } from "../copy-button/types";

export type PasswordRootPropsWithoutHTML = WithChildren<{
  ref?: HTMLDivElement | null;
  hidden?: boolean;
}>;

export type PasswordRootProps = WithoutChildren<
  HTMLAttributes<HTMLDivElement>
> &
  PasswordRootPropsWithoutHTML;

export type PasswordInputPropsWithoutHTML = WithChildren<{
  ref?: HTMLInputElement | null;
  value?: string;
}>;

export type PasswordInputProps = Omit<
  WithoutChildren<HTMLInputAttributes>,
  "type" | "files" | "aria-invalid" | "value"
> &
  PasswordInputPropsWithoutHTML;

export type PasswordToggleVisibilityProps = Omit<
  TogglePrimitive.RootProps,
  "children" | "pressed" | "aria-label" | "tabindex"
>;

export type PasswordCopyButtonProps = Omit<
  CopyButtonProps,
  "children" | "text"
>;

export type PasswordStrengthProps = WithoutChildren<MeterPrimitive.RootProps>;
