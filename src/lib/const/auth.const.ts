import type { Component } from "svelte";
import IconGoogle from "~icons/devicon-plain/google";
import IconEnvelope from "~icons/heroicons/envelope";

const PROVIDER_IDS = ["email", "google"] as const;

const PROVIDER_MAP: Record<
  IAuth.ProviderId,
  { name: string; is_sso: boolean; icon: Component }
> = {
  email: { name: "Email", is_sso: false, icon: IconEnvelope },
  google: { name: "Google", is_sso: true, icon: IconGoogle },
};

export const AUTH = {
  PROVIDERS: {
    IDS: PROVIDER_IDS,
    MAP: PROVIDER_MAP,
  },
};

export declare namespace IAuth {
  export type ProviderId = (typeof PROVIDER_IDS)[number];
}
