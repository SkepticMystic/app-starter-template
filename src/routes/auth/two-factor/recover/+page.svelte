<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import VerifyTwoFactorBackupCodeForm from "$lib/components/auth/two_factor/VerifyTwoFactorBackupCodeForm.svelte";
  import Anchor from "$lib/components/ui/anchor/Anchor.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
</script>

<article>
  <Card
    title="Two-Factor Recovery"
    class="mx-auto w-full max-w-xs"
  >
    {#snippet content()}
      <VerifyTwoFactorBackupCodeForm
        on_success={() => {
          goto(resolve("/profile"));
        }}
      />
    {/snippet}

    {#snippet footer()}
      <Anchor href={resolve("/auth/two-factor")}>
        Found your 2FA device? Enter your code
      </Anchor>
    {/snippet}
  </Card>
</article>
