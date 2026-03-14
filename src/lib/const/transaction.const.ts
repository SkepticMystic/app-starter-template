import type { BadgeVariant } from "$lib/components/ui/badge/badge.svelte";

const STATUS_IDS = ["success", "pending", "failed", "abandoned"] as const;
type StatusId = (typeof STATUS_IDS)[number];

const STATUS_MAP: Record<
  StatusId,
  {
    label: string;
    variant: BadgeVariant;
  }
> = {
  success: {
    label: "Success",
    variant: "success",
  },
  pending: {
    label: "Pending",
    variant: "default",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
  },
  abandoned: {
    label: "Abandoned",
    variant: "warning",
  },
};

/**
 * Transaction status constants and utilities for UI rendering
 */
export const TRANSACTION = {
  STATUS: {
    IDS: STATUS_IDS,
    MAP: STATUS_MAP,
  },
};
