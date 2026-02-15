import { z, type ZodObject, type ZodRawShape } from "zod";

/**
 * Creates a standardized query schema with pagination and filtering
 * 
 * @example
 * const get_tasks_schema = query_schema(z.object({
 *   status: where_schema.in(TaskStatusEnum),
 *   name: where_schema.ilike(),
 *   created_at: where_schema.date_range()
 * }));
 */
export const query_schema = <T extends ZodRawShape>(
  where: ZodObject<T>
) =>
  z.object({
    where,
    offset: z.number().int().min(0).default(0),
    limit: z.number().int().min(1).max(100).default(10),
    orderBy: z.literal("RANDOM()").optional()
  });

/**
 * Reusable where clause builders for common query patterns
 */
export const where_schema = {
  /**
   * Case-insensitive LIKE query
   * @example where: { name: where_schema.ilike() }
   */
  ilike: () => z.object({ ilike: z.string().optional() }),

  /**
   * IN clause for array matching
   * @example where: { status: where_schema.in(TaskStatusEnum) }
   */
  in: <T extends z.ZodTypeAny>(schema: T) =>
    z.object({ in: z.array(schema).optional() }),

  /**
   * NOT IN clause for array exclusion
   * @example where: { status: where_schema.nin(TaskStatusEnum) }
   */
  nin: <T extends z.ZodTypeAny>(schema: T) =>
    z.object({ nin: z.array(schema).optional() }),

  /**
   * Date range query with gte/lte
   * @example where: { created_at: where_schema.date_range() }
   */
  date_range: () =>
    z.object({
      gte: z.date().optional(),
      lte: z.date().optional()
    })
};
