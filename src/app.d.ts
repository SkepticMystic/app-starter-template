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
}
