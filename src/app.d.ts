declare global {
  namespace App {
    interface PageData {
      seo?: import("svelte-meta-tags").MetaTagsProps;
      base_seo?: import("svelte-meta-tags").MetaTagsProps;
    }

    interface Error {
      message: string;
      status?: number;
      // Comes from StandardSchema.Issue.path
      path?: readonly (PropertyKey | { key: PropertyKey })[];
      level?: "error" | "warning";
    }

    type Result<D> = import("$lib/interfaces").Result<D, App.Error>;
  }
}

export {};
