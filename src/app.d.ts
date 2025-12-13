declare global {
  namespace App {
    interface PageData {
      seo?: import("svelte-meta-tags").MetaTagsProps;
      base_seo?: import("svelte-meta-tags").MetaTagsProps;

      flash?: { level: "success" | "warning" | "error"; message: string };
    }

    interface Error {
      code?: string;
      message: string;
      status?: number;
      level?: "error" | "warning";
      // Comes from StandardSchema.Issue.path
      path?: readonly (PropertyKey | { key: PropertyKey })[];
    }

    type Result<D> = import("$lib/interfaces/result.type").Result<D, App.Error>;
  }
}

export {};
