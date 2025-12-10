<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import VerifyTwoFactorCodeForm from "$lib/components/auth/two_factor/VerifyTwoFactorCodeForm.svelte";
  import Anchor from "$lib/components/ui/anchor/Anchor.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
</script>

<article>
  <Card
    title="Two-Factor Auth Check"
    description="We need to verify your login."
    class="mx-auto w-full max-w-xs"
  >
    {#snippet content()}
      <VerifyTwoFactorCodeForm
        on_success={() => {
          goto(page.url.searchParams.get("redirect_uri") ?? "/");
        }}
      />
    {/snippet}

    {#snippet footer()}
      <Anchor href={resolve("/auth/two-factor/recover")}>
        Lost your 2FA device? Recover your account
      </Anchor>
    {/snippet}
  </Card>
</article>
