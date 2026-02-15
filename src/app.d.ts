declare global {
  namespace App {
    interface PageData {
      seo?: import("svelte-meta-tags").MetaTagsProps;
      base_seo?: import("svelte-meta-tags").MetaTagsProps;

      flash?: { level: "success" | "warning" | "error"; message: string };
    }

    type Session = Awaited<
      ReturnType<typeof import("$lib/server/services/auth.service").get_session>
    >;

    interface Locals {
      session?: Awaited<
        ReturnType<
          typeof import("$lib/server/services/auth.service").get_session
        >
      >;
    }

    interface Error {
      message: string;
      status?: number;
      level?: "error" | "warning";
      code?: import("$lib/const/error.const").AppErrorCode;
      // Comes from StandardSchema.Issue.path
      path?: readonly (PropertyKey | { key: PropertyKey })[];
    }

    type Result<D> = import("$lib/interfaces/result.type").Result<D, App.Error>;
  }
}

export {};
