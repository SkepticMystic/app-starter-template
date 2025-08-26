import "unplugin-icons/types/svelte";

/// <reference types="@sveltejs/kit" />
declare global {
  namespace App {
    interface PageData {
      seo?: {
        title: string;
        desc?: string;
        image_url?: string;
      };
    }
  }

  // NOTE: I've added the @types/umami package,
  // but it hasn't added types for identify(), only track()
  namespace umami {
    interface umami {
      /** Pass in your own ID to identify a user. */
      identify(identity_id: string): Promise<unknown>;

      /** Save data about the current session. */
      identify(
        indentity_id: string,
        data: Record<string, any>,
      ): Promise<unknown>;

      /** To save data without a unique ID, pass in only a JSON object. */
      identify(data: Record<string, any>): Promise<unknown>;
    }
  }
}
