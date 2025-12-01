import type { ResolvedPathname } from "$app/types";
import type { MaybePromise } from "$lib/interfaces";
import type { DropdownMenuItemPropsWithoutHTML } from "bits-ui";
import type { HTMLAttributeAnchorTarget } from "svelte/elements";

export type DropdownMenuItemInput =
  /** Simply gets ignored */
  | { kind: "none" }
  | {
      kind: "separator";
    }
  | {
      kind: "group";
      title: string;
      items: DropdownMenuItemInput[];
    }
  | ({
      kind?: "item";
      title: string;
      icon?: string;
      variant?: "default" | "destructive";

      hide?: boolean;
      disabled?: boolean;
      href?: ResolvedPathname;
      target?: HTMLAttributeAnchorTarget;

      onselect?: () => MaybePromise<unknown>;
    } & Omit<DropdownMenuItemPropsWithoutHTML, "onSelect" | "disabled">);
