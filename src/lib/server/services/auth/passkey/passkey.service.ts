import { getRequestEvent } from "$app/server";
import { ServiceUtil } from "$lib/server/services/service.util";
import { auth } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";

const log = Log.child({ service: "Passkey" });

const list = async (session: App.Session) => {
  const l = log.child({ method: "list" });

  try {
    const passkeys = await Repo.query(
      db.query.passkey.findMany({
        where: { userId: session.user.id },

        orderBy: { createdAt: "desc" },

        columns: {
          id: true,
          name: true,
          createdAt: true,
        },
      }),
    );

    return passkeys;
  } catch (error) {
    l.error(error, "error unknown");

    captureException(error);

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

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
