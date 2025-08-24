import type { toast } from "svelte-daisyui-toast";

const TOAST_IDS = {
  EMAIL_VERIFIED: "email-verified",
  INVITE_ACCEPTED: "invite-accepted",
};

type ToastInput = Omit<ReturnType<typeof toast.add>, "id">;

export const TOAST = {
  IDS: TOAST_IDS,

  MAP: {
    EMAIL_VERIFIED: {
      type: "success",
      message: "Email verified successfully",
      duration_ms: 7000,
    },

    INVITE_ACCEPTED: {
      type: "success",
      message: "Invitation accepted successfully",
      duration_ms: 7000,
    },
  } satisfies Record<keyof typeof TOAST_IDS, ToastInput>,
};
