<script lang="ts">
  import EnableTwoFactorForm from "$lib/components/auth/two_factor/EnableTwoFactorForm.svelte";
  import VerifyTwoFactorPinForm from "$lib/components/auth/two_factor/VerifyTwoFactorPinForm.svelte";
  import QrCode from "$lib/components/ui/qr-code/qr-code.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { TWO_FACTOR } from "$lib/const/auth/two_factor.const";
  import type { ResultData } from "$lib/interfaces/result.type";
  import type { verify_totp_remote } from "$lib/remote/auth/two_factor.remote";
  import { toast } from "svelte-sonner";

  let {
    on_success,
  }: {
    on_success: (
      data: ResultData<NonNullable<typeof verify_totp_remote.result>>,
    ) => void;
  } = $props();

  let totp_uri: string | null = $state(null);
</script>

{#if totp_uri === null}
  <EnableTwoFactorForm on_success={(data) => (totp_uri = data.totpURI)} />
{:else}
  <div class="flex flex-col items-center gap-5">
    <p class="text-sm text-muted-foreground">
      Scan the QR code below with your preferred authenticator app. Then, enter
      the {TWO_FACTOR.TOTP.DIGITS} digit code that the app provides to continue.
    </p>

    <QrCode
      size={256}
      value={totp_uri}
      class="rounded-md"
    />

    <Separator />
    <VerifyTwoFactorPinForm
      on_success={(data) => {
        toast.success("Two-factor authentication enabled");

        on_success(data);
      }}
    />
  </div>
{/if}
