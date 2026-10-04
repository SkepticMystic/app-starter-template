import { ERROR } from "#lib/const/error.const.js";
import type { MaybePromise } from "#lib/interfaces/index.js";
import {
  get_session,
  type GetSessionOptions,
} from "#lib/server/services/auth.service.js";
import type { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { result } from "#lib/utils/result.util.js";
import {
  command,
  form,
  query,
  type RemoteCommand,
  type RemoteForm,
  type RemoteFormInput,
  type RemoteFormInvalidField,
  type RemoteQueryFunction,
} from "$app/server";

/**
 * `command` / `query` / `query.batch` / `form` with {@link check_guard} in
 * front: session → `authorize` → rate limits → `resolve`, then the handler.
 * The handler is handed the principal (see {@link Guard.Ctx}) with whatever
 * `authorize` and `resolve` added merged on. A refusal is returned as an
 * `App.Result`, never thrown. See AGENTS.md § Remote Functions Pattern.
 *
 * Kit finds remote exports at runtime by `__.type`, so a helper that returns
 * what `command` made registers like a direct call. It lives under
 * `#lib/server` because a `.remote.ts` file may export only remote functions.
 */

/** Structurally what kit's `StandardSchemaV1.InferInput` / `InferOutput` read. */
type Schema = {
  readonly "~standard": {
    readonly types?:
      | { readonly input: unknown; readonly output: unknown }
      | undefined;
  };
};

type In<S extends Schema> = NonNullable<S["~standard"]["types"]>["input"];
type Out<S extends Schema> = NonNullable<S["~standard"]["types"]>["output"];

type FormSchema = Schema & {
  readonly "~standard": {
    readonly types?:
      | {
          readonly input: RemoteFormInput;
          readonly output: Record<string, unknown>;
        }
      | undefined;
  };
};

// Kit's own guard, which it does not export: a required boolean in a form
// schema can never be `false`, because an unchecked checkbox sends nothing.
// Restated so a guarded form keeps it.
type IsAny<T> = 0 extends 1 & T ? true : false;
type HasNonOptionalBoolean<T> =
  IsAny<T> extends true
    ? never
    : [T] extends [boolean]
      ? true
      : T extends (infer U)[]
        ? HasNonOptionalBoolean<U>
        : T extends Record<string, unknown>
          ? { [K in keyof T]: HasNonOptionalBoolean<T[K]> }[keyof T]
          : never;
type CheckedFormSchema<S extends FormSchema> =
  true extends HasNonOptionalBoolean<In<S>>
    ? "Error: All booleans in form schemas must be optional (e.g. `v.optional(v.boolean(), false)`) because checkbox inputs do not send a false value when unchecked."
    : S;

type Refusal = Extract<App.Result<never>, { ok: false }>;
type AnyResult = App.Result<unknown>;

/** What a handler is handed: the level's principal, plus what `authorize` and `resolve` added. */
type HandlerCtx<
  L extends Guard.Level,
  X extends object,
  A extends object,
> = Guard.Ctx<L> & A & X;

namespace Guard {
  /**
   * - `user` — signed in.
   * - `org` — acting in an active organization, as a current member. Checked
   *   here because a session can pass `admin: true` or `email_verified` with
   *   no org. The org fields are the ones `read_session` re-read this request,
   *   so a handler checks none of its ids.
   */
  export type Level = "user" | "org";

  /**
   * Who is asking. `session` is passed along because the services take an
   * `App.Session`; the ids beside it are what a handler should read.
   */
  export type User = {
    session: App.Session;
    user_id: string;
  };

  export type Member = User & {
    org_id: string;
    member_id: string;
    /** Better-Auth's comma-separated `member.role`, as the membership says it is now. */
    member_role: string;
  };

  /** What the handler is handed, by {@link Level}. */
  export type Ctx<L extends Level> = { user: User; org: Member }[L];

  /** A bucket key, limited to ids the {@link Level} guarantees. */
  export type Key<L extends Level> = {
    user: "user";
    org: "user" | "org" | "member";
  }[L];

  export type Limit<L extends Level> = {
    limiter: RateLimiter;
    by: Key<L>;
    /** Leading sentence of the 429, punctuation included. `enforce` appends the wait. */
    message: string;
    /**
     * Cost of the operation. Defaults to 1. Spent before the handler sees its
     * input, so a cost that depends on the input (a file count) is the
     * handler's own `enforce`.
     */
    tokens?: number;
  };

  /** A check that runs before the handler and adds its result to the context. */
  type Resolve<C, X extends object> = (ctx: C) => MaybePromise<App.Result<X>>;

  export type Options<
    L extends Level,
    X extends object = Record<never, never>,
    A extends object = Record<never, never>,
  > = {
    level: L;
    /** Passed to `get_session` verbatim: `admin`, `permissions`, `org_permissions`… */
    session?: GetSessionOptions;
    /** Which rows the caller may touch. Runs before the limits, so a refusal spends no token. */
    authorize?: Resolve<Ctx<L>, A>;
    /** Applied in order; the first refusal wins and later buckets are not spent. */
    limit?: Limit<L> | readonly Limit<L>[];
    /**
     * A preflight after every limit (a quota, a plan check), handed what
     * {@link Options.authorize} resolved. A separate key so
     * `{ ...GUARD, resolve }` keeps the rest.
     */
    resolve?: Resolve<Ctx<L> & A, X>;
  };
}

const key_of = <L extends Guard.Level>(
  by: Guard.Key<L>,
  ctx: Guard.Ctx<L>,
): string => {
  switch (by) {
    case "user":
      return ctx.user_id;
    case "org":
      return (ctx as Guard.Ctx<"org">).org_id;
    case "member":
      return (ctx as Guard.Ctx<"org">).member_id;
  }
};

const identify = <L extends Guard.Level>(
  level: L,
  session: App.Session,
): App.Result<Guard.Ctx<L>> => {
  const user: Guard.User = { session, user_id: session.user.id };

  if (level === "user") return result.suc(user as Guard.Ctx<L>);

  const org_id = ServiceUtil.session_org(session);
  if (!org_id.ok) return org_id;

  const member_id = ServiceUtil.session_member(session);
  if (!member_id.ok) return member_id;

  const member_role = session.session.member_role;
  if (!member_role) return result.err(ERROR.FORBIDDEN);

  const member: Guard.Member = {
    ...user,
    org_id: org_id.data,
    member_id: member_id.data,
    member_role,
  };

  return result.suc(member);
};

const spend = async <L extends Guard.Level>(
  limit: Guard.Limit<L> | readonly Guard.Limit<L>[] | undefined,
  ctx: Guard.Ctx<L>,
): Promise<App.Result<undefined>> => {
  const limits: readonly Guard.Limit<L>[] =
    limit === undefined ? [] : "limiter" in limit ? [limit] : limit;

  for (const { limiter, by, message, tokens } of limits) {
    // oxlint-disable-next-line no-await-in-loop -- ordered on purpose: a refused bucket must stop the next one being spent
    const rate = await limiter.enforce(key_of(by, ctx), { message, tokens });
    if (!rate.ok) return rate;
  }

  return result.suc(undefined);
};

/** Session, identity, `authorize`, limits, then `resolve` — the whole preamble, in that order. */
export const check_guard = async <
  L extends Guard.Level,
  X extends object = Record<never, never>,
  A extends object = Record<never, never>,
>(
  options: Guard.Options<L, X, A>,
): Promise<App.Result<HandlerCtx<L, X, A>>> => {
  const session = await get_session(options.session);
  if (!session.ok) return session;

  const ctx = identify(options.level, session.data);
  if (!ctx.ok) return ctx;

  const auth = options.authorize
    ? await options.authorize(ctx.data)
    : result.suc({} as A);
  if (!auth.ok) return auth;

  // The identity wins: `authorize` and `resolve` cannot overwrite a principal field.
  const authorized = { ...auth.data, ...ctx.data };

  const rate = await spend(options.limit, ctx.data);
  if (!rate.ok) return rate;

  if (!options.resolve) return result.suc(authorized as HandlerCtx<L, X, A>);

  const extra = await options.resolve(authorized);
  if (!extra.ok) return extra;

  return result.suc({ ...extra.data, ...authorized });
};

// One loose implementation behind the typed overloads.
type Handler = (...args: unknown[]) => unknown;
type Loose = Guard.Options<Guard.Level, object, object>;

const bare = (options: Loose, fn: Handler) => async () => {
  const ctx = await check_guard(options);
  return ctx.ok ? fn(ctx.data) : ctx;
};

/** `rest` is a form's `issue`. */
const with_input =
  (options: Loose, fn: Handler) =>
  async (input: unknown, ...rest: unknown[]) => {
    const ctx = await check_guard(options);
    return ctx.ok ? fn(input, ctx.data, ...rest) : ctx;
  };

/** Identity, so a `const` keeps `level` literal and the `authorize`/`resolve` types unwidened. */
export const define_guard = <
  L extends Guard.Level,
  X extends object = Record<never, never>,
  A extends object = Record<never, never>,
>(
  options: Guard.Options<L, X, A>,
) => options;

export function guarded_command<
  L extends Guard.Level,
  X extends object,
  A extends object,
  R extends AnyResult,
>(
  options: Guard.Options<L, X, A>,
  fn: (ctx: HandlerCtx<L, X, A>) => MaybePromise<R>,
): RemoteCommand<void, R | Refusal>;

export function guarded_command<
  L extends Guard.Level,
  X extends object,
  A extends object,
  S extends Schema,
  R extends AnyResult,
>(
  options: Guard.Options<L, X, A>,
  schema: S,
  fn: (input: Out<S>, ctx: HandlerCtx<L, X, A>) => MaybePromise<R>,
): RemoteCommand<In<S>, R | Refusal>;
export function guarded_command(
  options: Loose,
  ...args: [Handler] | [Schema, Handler]
) {
  return args.length === 1
    ? command(bare(options, args[0]))
    : command(args[0] as never, with_input(options, args[1]));
}

export function guarded_query<
  L extends Guard.Level,
  X extends object,
  A extends object,
  R extends AnyResult,
>(
  options: Guard.Options<L, X, A>,
  fn: (ctx: HandlerCtx<L, X, A>) => MaybePromise<R>,
): RemoteQueryFunction<void, R | Refusal>;

export function guarded_query<
  L extends Guard.Level,
  X extends object,
  A extends object,
  S extends Schema,
  R extends AnyResult,
>(
  options: Guard.Options<L, X, A>,
  schema: S,
  fn: (input: Out<S>, ctx: HandlerCtx<L, X, A>) => MaybePromise<R>,
): RemoteQueryFunction<In<S>, R | Refusal, Out<S>>;
export function guarded_query(
  options: Loose,
  ...args: [Handler] | [Schema, Handler]
) {
  return args.length === 1
    ? query(bare(options, args[0]))
    : query(args[0] as never, with_input(options, args[1]));
}

/** `query.batch`: the guard runs once, and a refusal answers every item. */
export const guarded_batch = <
  L extends Guard.Level,
  X extends object,
  A extends object,
  S extends Schema,
  // The item function, so `() => fault` beside `(id) => row` still infers.
  F extends (input: Out<S>, index: number) => AnyResult,
>(
  options: Guard.Options<L, X, A>,
  schema: S,
  fn: (inputs: Out<S>[], ctx: HandlerCtx<L, X, A>) => MaybePromise<F>,
): RemoteQueryFunction<In<S>, ReturnType<F> | Refusal, Out<S>> =>
  query.batch(
    schema as never,
    (async (inputs: Out<S>[]) => {
      const ctx = await check_guard(options);
      if (!ctx.ok) return () => ctx;

      return await fn(inputs, ctx.data);
    }) as never,
  );

export const guarded_form = <
  L extends Guard.Level,
  X extends object,
  A extends object,
  S extends FormSchema,
  R extends AnyResult,
>(
  options: Guard.Options<L, X, A>,
  schema: CheckedFormSchema<S>,
  fn: (
    input: Out<S>,
    ctx: HandlerCtx<L, X, A>,
    issue: RemoteFormInvalidField<In<S>>,
  ) => MaybePromise<R>,
): RemoteForm<In<S>, R | Refusal> =>
  form(schema as never, with_input(options as Loose, fn as Handler) as never);

/** Signed in, nothing more. */
export const USER = define_guard({ level: "user" });

/** Acting in an active organization. Spread it to add a limit or a permission. */
export const ORG = define_guard({ level: "org" });

/** The platform back office: the global `user.role`, no org. Spread it to add a limit. */
export const ADMIN = define_guard({ level: "user", session: { admin: true } });
