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

/**
 * Execute a query that returns a single result
 * @returns Result with single record or NOT_FOUND error
 */
const query_one = async <T>(
  promise: Promise<T | undefined>
): Promise<App.Result<T>> => {
  try {
    const data = await promise;

    if (!data) {
      return result.err(ERROR.NOT_FOUND);
    }

    return result.suc(data);
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      Log.error(error, "Repo.query_one.error DrizzleQueryError");

      captureException(error, {
        tags: { query: error.query },
      });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else if (error instanceof DrizzleError) {
      Log.error(error, "Repo.query_one.error DrizzleError");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else {
      Log.error(error, "Repo.query_one.error unknown");

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

      if (
        error.cause?.message.includes(
          "duplicate key value violates unique constraint",
        )
      ) {
        return result.err(ERROR.DUPLICATE);
      } else {
        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
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

      if (
        error.cause?.message.includes(
          "duplicate key value violates unique constraint",
        )
      ) {
        return result.err(ERROR.DUPLICATE);
      } else {
        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
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
  try {
    const data = await promise;
    
    const [first] = data;
    
    if (!first) {
      Log.error("Repo.update_one.error no data");
      return result.err(ERROR.NOT_FOUND);
    }
    
    return result.suc(first);
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      // Check for duplicate key BEFORE logging to Sentry
      if (
        error.cause?.message.includes(
          "duplicate key value violates unique constraint",
        )
      ) {
        return result.err(ERROR.DUPLICATE);
      }
      
      Log.error(error, "Repo.update_one.error DrizzleQueryError");

      captureException(error, {
        tags: { query: error.query },
        contexts: {
          drizzle_error: {
            message: error.message,
            cause: error.cause?.message
          }
        }
      });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else if (error instanceof DrizzleError) {
      Log.error(error, "Repo.update_one.error DrizzleError");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else {
      Log.error(error, "Repo.update_one.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
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

/**
 * Execute an update without returning data
 * Validates that exactly 1 row was affected
 * @returns Result<void>
 */
const update_void = async (
  promise: Promise<{ rowCount: number }>
): Promise<App.Result<void>> => {
  try {
    const res = await promise;

    if (res.rowCount === 0) {
      return result.err(ERROR.NOT_FOUND);
    }

    return result.suc(undefined);
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      // Check for duplicate key BEFORE logging to Sentry
      if (
        error.cause?.message.includes(
          "duplicate key value violates unique constraint",
        )
      ) {
        return result.err(ERROR.DUPLICATE);
      }
      
      Log.error(error, "Repo.update_void.error DrizzleQueryError");

      captureException(error, {
        tags: { query: error.query },
        contexts: {
          drizzle_error: {
            message: error.message,
            cause: error.cause?.message
          }
        }
      });

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else if (error instanceof DrizzleError) {
      Log.error(error, "Repo.update_void.error DrizzleError");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    } else {
      Log.error(error, "Repo.update_void.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const delete_one = async (
  promise: Promise<Omit<FullQueryResults<false>, "rows"> & { rows: never[] }>,
): Promise<App.Result<void>> => {
  const res = await del(promise);
  if (!res.ok) {
    return res;
  }

  if (!res.data.row_count) {
    Log.error("Repo.delete_one.error not found");

    return result.err(ERROR.NOT_FOUND);
  } else {
    return result.suc(undefined);
  }
};

export const Repo = {
  query,
  query_one,
  insert,
  insert_one,
  update,
  update_one,
  update_void,
  delete: del,
  delete_one,
};
