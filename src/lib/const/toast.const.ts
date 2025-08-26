import { toast } from "svelte-daisyui-toast";

toast.defaults.set({ clear_on_navigate: true, duration_ms: 10_000 });

const TOAST_IDS = {
  USER_DELETED: "user-deleted",
  EMAIL_VERIFIED: "email-verified",
  PASSWORD_RESET: "password-reset",
  ORG_INVITE_ACCEPTED: "org-invite-accepted",
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
    USER_DELETED: {
      type: "success",
      message: "User deleted successfully",
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
  } satisfies Record<IToast.Key, IToast.Input>,
};
