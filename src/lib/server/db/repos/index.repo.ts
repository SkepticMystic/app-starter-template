import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { DrizzleError, DrizzleQueryError } from "drizzle-orm";

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
          params: error.params.join(", "),
        },
      });

      return result.err({ message: "Internal service error", status: 500 });
    } else if (error instanceof DrizzleError) {
      Log.error(error, "Repo.query.error DrizzleError");

      captureException(error);

      return result.err({ message: "Internal service error", status: 500 });
    } else {
      Log.error(error, "Repo.query.error unknown");

      captureException(error);

      return result.err({ message: "Internal service error", status: 500 });
    }
  }
};

const insert_one = async <D>(promise: Promise<D[]>): Promise<App.Result<D>> => {
  try {
    const [data] = await promise;

    if (!data) {
      Log.error("Repo.insert_one.error no data");

      return result.err({ message: "Failed to create", status: 500 });
    } else {
      return result.suc(data);
    }
  } catch (error) {
    if (error instanceof DrizzleQueryError) {
      Log.error(error, "Repo.insert_one.error DrizzleQueryError");

      captureException(error, {
        tags: {
          query: error.query,
          params: error.params.join(", "),
        },
      });

      return result.err({ message: "Internal service error", status: 500 });
    } else if (error instanceof DrizzleError) {
      Log.error(error, "Repo.insert_one.error DrizzleError");

      captureException(error);

      return result.err({ message: "Internal service error", status: 500 });
    } else {
      Log.error(error, "Repo.insert_one.error unknown");

      captureException(error);

      return result.err({ message: "Internal service error", status: 500 });
    }
  }
};

export const Repo = {
  query,
  insert_one,
};
