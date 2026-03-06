<script lang="ts">
  import { resolve } from "$app/paths";
  import EnableTwoFactorForm from "$lib/components/form/auth/two_factor/EnableTwoFactorForm.svelte";
  import VerifyTwoFactorCodeForm from "$lib/components/form/auth/two_factor/VerifyTwoFactorCodeForm.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import CopyButton from "$lib/components/ui/copy-button/copy-button.svelte";
  import QrCode from "$lib/components/ui/qr-code/qr-code.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { TWO_FACTOR } from "$lib/const/auth/two_factor.const.js";
  import type { ResultData } from "$lib/interfaces/result.type.js";
  import type { enable_two_factor_remote } from "$lib/remote/auth/two_factor.remote.js";

  let enable_data: ResultData<
    NonNullable<typeof enable_two_factor_remote.result>
  > | null = $state(null);

  let verified = $state(false);
</script>

<article>
  <header>
    <h1>Enable Two-Factor Authentication</h1>
  </header>

  <section>
    {#if enable_data === null}
      <Card
        title="Enable Two-Factor Authentication"
        description="You will need to provide your password."
      >
        {#snippet content()}
          <EnableTwoFactorForm on_success={(data) => (enable_data = data)} />
        {/snippet}

        {#snippet footer()}
          <Button
            variant="outline"
            icon="lucide/arrow-left"
            href={resolve("/settings/account")}
          >
            Go Back
          </Button>
        {/snippet}
      </Card>
    {:else if verified === false}
      {@const setup_key = new URL(enable_data.totpURI).searchParams.get(
        "secret",
      )}

      <Card
        title="Verify Two-Factor Authentication"
        description="Scan the QR code below with your preferred authenticator app. Then,
          enter the {TWO_FACTOR.TOTP
          .DIGITS} digit code that the app provides to continue."
      >
        {#snippet content()}
          <div class="flex flex-col items-center gap-5">
            <QrCode
              size={256}
              class="rounded-md"
              value={enable_data.totpURI}
            />

            {#if setup_key}
              <p class="text-sm text-muted-foreground">
                Or, copy the setup key into your authenticator app
              </p>

              <output class="font-mono text-sm wrap-anywhere">
                {setup_key}
              </output>
              <CopyButton text={setup_key}>Copy Setup Key</CopyButton>
            {/if}

            <Separator />
            <VerifyTwoFactorCodeForm
              on_success={() => {
                verified = true;
              }}
            />
          </div>
        {/snippet}
      </Card>
    {:else if verified === true}
      {@const backup_codes_str = enable_data.backupCodes.join("\n")}

      <Card
        title="Two-Factor Recovery"
        description="Save your backups codes. These will allow you to recover your account if you lose access to your 2FA device. Please store them separately and securely. They will only be shown once."
      >
        {#snippet content()}
          <div class="flex flex-col gap-3">
            <CopyButton
              variant="default"
              text={backup_codes_str}
            >
              Copy Backup Codes
            </CopyButton>

            <output>
              <ul class="flex flex-wrap gap-x-4 gap-y-2">
                {#each enable_data.backupCodes as code}
                  <li>
                    <span class="font-mono text-sm">{code}</span>
                  </li>
                {/each}
              </ul>
            </output>
          </div>
        {/snippet}

        {#snippet footer()}
          <Button
            variant="outline"
            icon="lucide/arrow-left"
            href={resolve("/settings/account")}
          >
            Go Back
          </Button>
        {/snippet}
      </Card>
    {/if}
  </section>
</article>
