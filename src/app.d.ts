declare global {
  namespace App {
    interface PageData {
      seo?: {
        title: string;
        desc?: string;
        image_url?: string;
      };
    }

    namespace Superforms {
      type Message = import("$lib/interfaces/index").Result<
        string | undefined,
        string | undefined
      >;
    }
  }
}

export {};
