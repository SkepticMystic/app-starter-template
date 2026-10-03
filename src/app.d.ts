declare global {
  namespace App {
    interface PageData {
      seo?: import("svelte-meta-tags").MetaTagsProps;
      base_seo?: import("svelte-meta-tags").MetaTagsProps;
      /** The active org as the server read it, for `#lib/utils/auth/permission.util`'s `can()`. */
      org?: { role: string | null } | null;
    }

    type Session = {
      session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined;
        userAgent?: string | null | undefined;
        org_id?: string | null | undefined;
        member_id?: string | null | undefined;
        member_role?: string | null | undefined;
        impersonatedBy?: string | null | undefined;
        activeOrganizationId?: string | null | undefined;
      };
      user: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null | undefined;
        banned: boolean | null | undefined;
        role?: string | null | undefined;
        banReason?: string | null | undefined;
        banExpires?: Date | null | undefined;
        twoFactorEnabled: boolean | null | undefined;
      };
    };

    interface Locals {
      session?: App.Session;
    }

    // `status` and `message` are declared by SvelteKit itself, and since 3.0
    // `status` is always present.
    interface Error {
      /**
       * The toast's detail line under `message`, overriding `Toast.from_error`'s
       * split; usually left unset. UI copy only.
       */
      description?: string;
      level?: "error" | "warning";
      code?: import("#lib/const/error.const.js").AppErrorCode;
      // Comes from StandardSchema.Issue.path
      path?: readonly (PropertyKey | { key: PropertyKey })[];
    }

    type Result<D> = import("#lib/interfaces/result.type.js").Result<
      D,
      App.Error
    >;
  }
}

export {};
