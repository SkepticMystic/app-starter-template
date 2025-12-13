import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import type { FullQueryResults } from "@neondatabase/serverless";
import { captureException } from "@sentry/sveltekit";
import { DrizzleError, DrizzleQueryError } from "drizzle-orm";
import { ERROR } from "$lib/const/error.const";

const query = async <D>(promise: Promise<D>): Promise<App.Result<D>> => {
  try {
    const data = await promise;

    return result.suc(data);
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      Log.error(error, "Repo.query.error DrizzleQueryError");

      captureException(error, {
        tags: {
          query: error.query,
        },
      });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else if (error instanceof DrizzleError) {
      Log.error(error, "Repo.query.error DrizzleError");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else {
      Log.error(error, "Repo.query.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const insert = async <D>(promise: Promise<D[]>): Promise<App.Result<D[]>> => {
  try {
    const data = await promise;

    return result.suc(data);
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      Log.error(error, "Repo.insert.error DrizzleQueryError");

      captureException(error, {
        tags: { query: error.query },
      });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else if (error instanceof DrizzleError) {
      Log.error(error, "Repo.insert.error DrizzleError");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else {
      Log.error(error, "Repo.insert.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const insert_one = async <D>(promise: Promise<D[]>): Promise<App.Result<D>> => {
  const res = await insert(promise);

  if (!res.ok) {
    return res;
  }

  const [data] = res.data;

  if (!data) {
    Log.error("Repo.insert_one.error no data");

    return result.err({ message: "Failed to create", status: 500 });
  } else {
    return result.suc(data);
  }
};

const update = async <D>(promise: Promise<D[]>): Promise<App.Result<D[]>> => {
  try {
    const data = await promise;

    return result.suc(data);
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      Log.error(error, "Repo.update.error DrizzleQueryError");

      captureException(error, {
        tags: { query: error.query },
      });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else if (error instanceof DrizzleError) {
      Log.error(error, "Repo.update.error DrizzleError");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else {
      Log.error(error, "Repo.update.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const update_one = async <D>(promise: Promise<D[]>): Promise<App.Result<D>> => {
  const res = await update(promise);
  if (!res.ok) {
    return res;
  }

  const [data] = res.data;

  if (!data) {
    Log.error("Repo.update_one.error no data");

    return result.err({ message: "Failed to update", status: 500 });
  } else {
    return result.suc(data);
  }
};

const del = async (
  promise: Promise<Omit<FullQueryResults<false>, "rows"> & { rows: never[] }>,
): Promise<App.Result<{ row_count: number }>> => {
  try {
    const res = await promise;

    return result.suc({ row_count: res.rowCount });
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      Log.error(error, "Repo.delete.error DrizzleQueryError");

      captureException(error, {
        tags: { query: error.query },
      });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else if (error instanceof DrizzleError) {
      Log.error(error, "Repo.delete.error DrizzleError");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else {
      Log.error(error, "Repo.delete.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const delete_one = async (
  promise: Promise<Omit<FullQueryResults<false>, "rows"> & { rows: never[] }>,
): Promise<App.Result<null>> => {
  const res = await del(promise);
  if (!res.ok) {
    return res;
  }

  if (!res.data.row_count) {
    Log.error("Repo.delete_one.error not found");

    return result.err({ message: "Not found", status: 404 });
  } else {
    return result.suc(null);
  }
};

export const Repo = {
  query,
  insert,
  insert_one,
  update,
  update_one,
  delete: del,
  delete_one,
};
