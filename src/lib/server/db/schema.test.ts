import { AccessControl } from "#lib/const/auth/access_control.const.js";
import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import { paystack } from "better-auth-paystack";
import { getSchema } from "better-auth/db";
import {
  admin,
  haveIBeenPwned,
  lastLoginMethod,
  organization,
  twoFactor,
} from "better-auth/plugins";
import { getColumns, is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vite-plus/test";
import { schema } from "./schema.js";

/**
 * The drizzle adapter resolves a Better-Auth model by exact `schema[model]` key
 * and a field by exact property name, and throws on a miss — at request time,
 * on whichever endpoint first touches it. Nothing type-checks either, so this
 * is the guard. `getSchema` returns core plus every enabled plugin's models,
 * `additionalFields` included.
 */

/**
 * Only the options that change the model set. A hand-kept copy — `auth.ts`
 * cannot load under test, it opens the database and Redis at import — so keep
 * it in step with `auth.ts`'s `plugins`. `captcha`, `genericOAuth` and
 * `sveltekitCookies` add no models and are left out.
 *
 * `session.additionalFields` is left out too: `storeSessionInDatabase: false`
 * keeps sessions in Redis, so those fields never reach the adapter.
 */
const options = () => ({
  plugins: [
    admin({ ac: AccessControl.ac, roles: AccessControl.roles }),
    twoFactor(),
    passkey(),
    haveIBeenPwned(),
    lastLoginMethod(),
    organization(),
    apiKey([{ configId: "default", references: "organization" }]),
    paystack({
      secretKey: "sk_test_schema_coverage",
      subscription: { enabled: true, plans: [] },
      organization: { enabled: true },
    }),
  ],
});

/**
 * Fields a plugin asks for that have no column yet, by `model.field`, each
 * with its reason. Same ratchet as `UNINDEXED` below: a stale entry fails.
 */
const MISSING: Record<string, string> = {};

/** Every `model.field` Better-Auth asks for that the model's table lacks. */
const missing_fields = () =>
  Object.entries(getSchema(options())).flatMap(([model, definition]) => {
    const table = (schema as Record<string, unknown>)[model];
    if (!table) return [];

    const columns = getColumns(table as never);

    return Object.keys(definition.fields ?? {})
      .filter((name) => !(name in columns))
      .map((name) => `${model}.${name}`);
  });

describe("schema — Better-Auth model coverage", () => {
  it("declares a table for every model Better-Auth resolves", () => {
    const models = Object.keys(getSchema(options()));

    // Guards against the final assertion passing vacuously.
    expect(models).toEqual(
      expect.arrayContaining(["user", "session", "account", "verification"]),
    );

    expect(models.filter((model) => !(model in schema))).toEqual([]);
  });

  // By JS property name, not column name (`customerCode` is `customer_code`).
  it("declares a column for every field those models are asked for", () => {
    expect(missing_fields().filter((key) => !(key in MISSING))).toEqual([]);
  });

  it("excuses only fields that are still missing", () => {
    const missing = new Set(missing_fields());

    expect(Object.keys(MISSING).filter((key) => !missing.has(key))).toEqual([]);
  });
});

/** Every FK as `table.column` (its first column), and whether an index leads with it. */
const foreign_keys = () =>
  Object.values(schema).flatMap((table) => {
    if (!is(table, PgTable)) return [];

    const config = getTableConfig(table);

    // A primary key or unique constraint is an index too.
    const leading = new Set<string>([
      ...config.indexes.flatMap((index) => {
        const [first] = index.config.columns;

        return first && "name" in first && first.name ? [first.name] : [];
      }),
      ...config.primaryKeys.flatMap((pk) =>
        pk.columns[0] ? [pk.columns[0].name] : [],
      ),
      ...config.uniqueConstraints.flatMap((uq) =>
        uq.columns[0] ? [uq.columns[0].name] : [],
      ),
      ...config.columns
        .filter((column) => column.primary || column.isUnique)
        .map((column) => column.name),
    ]);

    return config.foreignKeys.flatMap((fk) => {
      const column = fk.reference().columns[0]?.name;
      if (!column) return [];

      return [
        { key: `${config.name}.${column}`, indexed: leading.has(column) },
      ];
    });
  });

/**
 * Postgres indexes a foreign key's referenced side, never its referencing side,
 * so every `restrict`, `set null` or `cascade` on an unindexed column scans the
 * child table once per parent row deleted — and an org delete deletes every
 * row it owns. This is the ratchet: a new FK is indexed, or listed here with
 * the reason a scan is acceptable. Entries leave as columns get indexes; a
 * stale one fails.
 */
describe("schema — foreign keys are indexed", () => {
  const SESSION =
    "Better-Auth's `session`, which `storeSessionInDatabase: false` leaves empty";

  /** `table.column`, by database name. */
  const UNINDEXED: Record<string, string> = {
    "session.active_organization_id": SESSION,
    "session.impersonated_by": SESSION,
    "session.member_id": SESSION,
  };

  it("indexes every foreign key the list does not excuse", () => {
    const fks = foreign_keys();

    // Guards against the assertions below passing vacuously.
    expect(fks.length).toBeGreaterThan(10);

    expect(
      fks
        .filter((fk) => !fk.indexed && !(fk.key in UNINDEXED))
        .map((fk) => fk.key),
    ).toEqual([]);
  });

  it("lists only foreign keys that exist and are still unindexed", () => {
    const unindexed = new Set(
      foreign_keys()
        .filter((fk) => !fk.indexed)
        .map((fk) => fk.key),
    );

    expect(Object.keys(UNINDEXED).filter((key) => !unindexed.has(key))).toEqual(
      [],
    );
  });
});
