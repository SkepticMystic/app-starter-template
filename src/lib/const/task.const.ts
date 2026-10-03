import type { BadgeStatus } from "../components/ui/badge/index.js";

const STATUS_IDS = ["pending", "in_progress", "completed", "archived"] as const;

type StatusId = (typeof STATUS_IDS)[number];

/**
 * Read as `StatusBadge`s, on the loudness ladder in `ui/badge/index.ts`: done is the expected
 * outcome, so it stays quiet, and only the task being worked on now is filled. Pending and done
 * share a loudness and are told apart by shape.
 */
const STATUS_MAP = {
  pending: { label: "Pending", variant: "outline", cue: "draft" },
  in_progress: { label: "In progress", variant: "default", cue: "live" },
  completed: { label: "Completed", variant: "outline" },
  archived: { label: "Archived", variant: "secondary" },
} satisfies Record<StatusId, BadgeStatus>;

export const TASKS = {
  STATUS: {
    IDS: STATUS_IDS,
    MAP: STATUS_MAP,
    OPTIONS: STATUS_IDS.map((id) => ({
      value: id,
      label: STATUS_MAP[id].label,
    })),
  },
};
