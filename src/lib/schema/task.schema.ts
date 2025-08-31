import z from "zod";

export const TaskSchema = {
  create: z.object({
    title: z.string().min(1, "Title is required").max(255, "Title is too long"),
    description: z.string().optional(),
    due_date: z.date().optional(),
    completed: z.boolean().default(false),
  }),
};
