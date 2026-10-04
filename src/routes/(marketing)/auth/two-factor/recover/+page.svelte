<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import VerifyTwoFactorBackupCodeForm from "#lib/components/form/auth/two_factor/VerifyTwoFactorBackupCodeForm.svelte";
  import Anchor from "#lib/components/ui/anchor/Anchor.svelte";
  import Card from "#lib/components/ui/card/Card.svelte";
</script>

<article>
  <Card
    heading="h1"
    title="Two-factor recovery"
    description="Enter one of your backup codes. Each code works once, so set up two-factor again on a new device afterwards."
    class="mx-auto w-full max-w-xs"
  >
    {#snippet children()}
      <VerifyTwoFactorBackupCodeForm
        on_success={() => {
          // To account settings, where two-factor can be set up again.
          goto(resolve("settings/account"), { refreshAll: true });
        }}
      />
    {/snippet}

    {#snippet footer()}
      <Anchor href={resolve("auth/two-factor")}
        >Found your 2FA device? Enter your code</Anchor
      >
    {/snippet}
  </Card>
</article>
