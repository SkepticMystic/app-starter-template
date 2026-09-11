import type { BadgeVariant } from "$lib/components/ui/badge";

/**
 * Every status Paystack may send, not just the ones we care about.
 * `reconcilePaystackTransaction` writes Paystack's status straight into this
 * enum with no guard, so a value missing here fails the UPDATE and 500s the
 * page somebody opened to check whether their payment went through.
 */
const STATUS_IDS = [
  "success",
  "pending",
  "failed",
  "abandoned",
  "ongoing",
  "processing",
  "queued",
  "reversed",
] as const;
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
  ongoing: {
    label: "Ongoing",
    variant: "default",
  },
  processing: {
    label: "Processing",
    variant: "default",
  },
  queued: {
    label: "Queued",
    variant: "default",
  },
  reversed: {
    label: "Reversed",
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
