const STATUS_IDS = ["pending", "in_progress", "completed", "archived"] as const;

type StatusId = (typeof STATUS_IDS)[number];

const STATUS_MAP = {
  pending: { label: "Pending" },
  in_progress: { label: "In Progress" },
  completed: { label: "Completed" },
  archived: { label: "Archived" },
} satisfies Record<StatusId, { label: string }>;

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
