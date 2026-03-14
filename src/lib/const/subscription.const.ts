import type { BadgeVariant } from "$lib/components/ui/badge/badge.svelte";

const STATUS_IDS = ["active", "trialing", "canceled", "incomplete"] as const;
type StatusId = (typeof STATUS_IDS)[number];

const STATUS_MAP: Record<
  StatusId,
  {
    label: string;
    variant: BadgeVariant;
  }
> = {
  active: {
    label: "Active",
    variant: "success",
  },
  trialing: {
    label: "Trial",
    variant: "default",
  },
  canceled: {
    label: "Canceled",
    variant: "destructive",
  },
  incomplete: {
    label: "Incomplete",
    variant: "warning",
  },
};

const PLAN_IDS = ["free", "pro", "enterprise"] as const;
type PlanId = (typeof PLAN_IDS)[number];
const PLAN_MAP: Record<
  PlanId,
  {
    label: string;
  }
> = {
  free: {
    label: "Free",
  },
  pro: {
    label: "Pro",
  },
  enterprise: {
    label: "Enterprise",
  },
};

/**
 * Subscription status constants and utilities for UI rendering
 */
export const SUBSCRIPTION = {
  STATUS: {
    IDS: STATUS_IDS,
    MAP: STATUS_MAP,
  },

  PLAN: {
    IDS: PLAN_IDS,
    MAP: PLAN_MAP,
  },
};
