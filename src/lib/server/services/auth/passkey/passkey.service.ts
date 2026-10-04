import { getRequestEvent } from "$app/server";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { auth } from "#lib/auth.js";
import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";

const log = Log.child({ service: "Passkey" });

// `Repo.query` returns a refusal rather than throwing, so there is nothing to catch.
const list = async (session: App.Session) =>
  Repo.query(
    db.query.passkey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      columns: { id: true, name: true, createdAt: true },
    }),
  );

const rename = async (input: {
  id: string;
  name: string;
}): Promise<App.Result<Awaited<ReturnType<typeof auth.api.updatePasskey>>>> => {
  const l = log.child({ method: "rename" });

  try {
    const res = await auth.api.updatePasskey({
      body: { id: input.id, name: input.name },
      headers: getRequestEvent().request.headers,
    });

    return result.suc(res);
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: l });
  }
};

const remove = async (passkey_id: string): Promise<App.Result<undefined>> => {
  const l = log.child({ method: "remove" });

  try {
    await auth.api.deletePasskey({
      body: { id: passkey_id },
      headers: getRequestEvent().request.headers,
    });

    return result.suc(undefined);
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: l });
  }
};

export const PasskeyService = { list, rename, remove };
