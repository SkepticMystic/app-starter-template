import { error } from "@sveltejs/kit";
import { z } from "zod";

const raw = <
  Shape extends z.core.$ZodShape,
  Config extends z.core.$ZodObjectConfig = z.core.$strip,
>(
  input: unknown,
  schema: z.ZodObject<Shape, Config>,
) => {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const { message, path } = parsed.error.issues[0];

    error(400, `${message} at ${path.join(".")}`);
  } else {
    return parsed.data;
  }
};

/** Try parsing a request using a Zod schema
 * Throws a SK error if invalid
 */
const request = async <
  Shape extends z.core.$ZodShape,
  Config extends z.core.$ZodObjectConfig = z.core.$strip,
>(
  request: Request,
  schema: z.ZodObject<Shape, Config>,
) => {
  const input = await request.json();
  return raw(input, schema);
};

const form = async <
  Shape extends z.core.$ZodShape,
  Config extends z.core.$ZodObjectConfig = z.core.$strip,
>(
  request: Request,
  schema: z.ZodObject<Shape, Config>,
) => {
  const form = await request.formData();
  const input = Object.fromEntries(form);
  return raw(input, schema);
};

const url = <
  Shape extends z.core.$ZodShape,
  Config extends z.core.$ZodObjectConfig = z.core.$strip,
>(
  params: URLSearchParams | URL,
  schema: z.ZodObject<Shape, Config>,
) => {
  const input = Object.fromEntries(
    params instanceof URLSearchParams ? params : params.searchParams,
  );
  return raw(input, schema);
};

export const Parsers = {
  url,
  raw,
  form,
  request,
};
