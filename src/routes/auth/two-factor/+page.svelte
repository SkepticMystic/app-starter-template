<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import VerifyTwoFactorPinForm from "$lib/components/auth/two_factor/VerifyTwoFactorPinForm.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
</script>

<article>
  <Card
    title="Two-Factor Auth Check"
    description="We need to verify your login."
    class="mx-auto w-full max-w-xs"
  >
    {#snippet content()}
      <VerifyTwoFactorPinForm
        on_success={() => {
          goto(page.url.searchParams.get("redirect_uri") ?? "/");
        }}
      />
    {/snippet}
  </Card>
</article>
