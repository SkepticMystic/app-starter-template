import type { Component } from "svelte";
import IconGoogle from "~icons/devicon-plain/google";
import IconEnvelope from "~icons/heroicons/envelope";
import IconFingerprint from "~icons/heroicons/finger-print";

const PROVIDER_IDS = [
  "credential",
  // TODO: Check if passkey is actually a provider, or just it's own thing
  "passkey",
  "google",
] as const;

const PROVIDER_MAP: Record<
  IAuth.ProviderId,
  { name: string; is_sso: boolean; icon: Component }
> = {
  credential: { name: "Email", is_sso: false, icon: IconEnvelope },
  passkey: { name: "Passkey", is_sso: false, icon: IconFingerprint },
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
