<script lang="ts">
  import EnableTwoFactorForm from "$lib/components/auth/two_factor/EnableTwoFactorForm.svelte";
  import VerifyTwoFactorCodeForm from "$lib/components/auth/two_factor/VerifyTwoFactorCodeForm.svelte";
  import CopyButton from "$lib/components/ui/copy-button/copy-button.svelte";
  import QrCode from "$lib/components/ui/qr-code/qr-code.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { TWO_FACTOR } from "$lib/const/auth/two_factor.const";
  import type { ResultData } from "$lib/interfaces/result.type";
  import type { enable_two_factor_remote } from "$lib/remote/auth/two_factor.remote";
  import { toast } from "svelte-sonner";

  let {
    on_success,
  }: {
    on_success: () => void;
  } = $props();

  let enable_data: ResultData<
    NonNullable<typeof enable_two_factor_remote.result>
  > | null = $state(null);

  let verified = $state(false);
</script>

{#if enable_data === null}
  <EnableTwoFactorForm on_success={(data) => (enable_data = data)} />
{:else if verified === false}
  {@const setup_key = new URL(enable_data.totpURI).searchParams.get("secret")}

  <div class="flex flex-col items-center gap-5">
    <p class="text-sm text-muted-foreground">
      Scan the QR code below with your preferred authenticator app. Then, enter
      the {TWO_FACTOR.TOTP.DIGITS} digit code that the app provides to continue.
    </p>

    <QrCode
      size={256}
      class="rounded-md"
      value={enable_data.totpURI}
    />

    {#if setup_key}
      <p class="text-sm text-muted-foreground">
        Or, copy the setup key into your authenticator app
      </p>

      <output>{setup_key}</output>
      <CopyButton text={setup_key} />
    {/if}

    <Separator />
    <VerifyTwoFactorCodeForm
      on_success={() => {
        verified = true;
      }}
    />
  </div>
{:else if verified === true}
  {@const backup_codes_str = enable_data.backupCodes.join("\n")}

  <div class="flex flex-col items-center gap-5">
    <p class="text-sm text-muted-foreground">
      Save your backups codes. These will allow you to recover your account if
      you lose access to your 2FA device. Please store them separately and
      securely. They will only be shown once.
    </p>

    <output>
      {backup_codes_str}
    </output>

    <CopyButton text={backup_codes_str}></CopyButton>
  </div>
{/if}
