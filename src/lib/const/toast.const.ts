import { toast } from "svelte-daisyui-toast";

toast.defaults.set({ clear_on_navigate: true, duration_ms: 10_000 });

const TOAST_IDS = {
  SIGNED_OUT: "signed-out",
  USER_DELETED: "user-deleted",
  PASSKEY_ADDED: "passkey-added",
  EMAIL_VERIFIED: "email-verified",
  PASSWORD_RESET: "password-reset",

  ORG_INVITE_ACCEPTED: "org-invite-accepted",

  ADMIN_IMPERSONATING_USER: "admin-impersonating-user",
} as const;

const TOAST_IDS_REVERSED = Object.fromEntries(
  Object.entries(TOAST_IDS).map(([key, value]) => [value, key]),
) as Record<IToast.Id, IToast.Key>;

export declare namespace IToast {
  export type Key = keyof typeof TOAST_IDS;
  export type Id = (typeof TOAST_IDS)[IToast.Key];

  export type Input = Omit<ReturnType<typeof toast.add>, "id">;
}

export const TOAST = {
  IDS: TOAST_IDS,
  IDS_REVERSED: TOAST_IDS_REVERSED,

  MAP: {
    SIGNED_OUT: {
      type: "info",
      message: "Signed out",
    },

    USER_DELETED: {
      type: "success",
      message: "User deleted successfully",
    },

    PASSKEY_ADDED: {
      type: "success",
      message: "Passkey added successfully",
    },

    EMAIL_VERIFIED: {
      type: "success",
      message: "Email verified successfully",
    },

    PASSWORD_RESET: {
      type: "success",
      message: "Password reset successfully",
    },

    ORG_INVITE_ACCEPTED: {
      type: "success",
      message: "Invitation accepted successfully",
    },

    ADMIN_IMPERSONATING_USER: {
      type: "info",
      message: "You are now impersonating this user",
    },
  } satisfies Record<IToast.Key, IToast.Input>,
};
