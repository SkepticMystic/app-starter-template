<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import DisableTwoFactorForm from "$lib/components/form/auth/two_factor/DisableTwoFactorForm.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
</script>

<article>
  <header>
    <h1>Disable Two-Factor Authentication</h1>
  </header>

  <Card>
    {#snippet content()}
      <DisableTwoFactorForm
        on_success={async () => {
          await goto("/settings/account");
        }}
      />
    {/snippet}

    {#snippet footer()}
      <Button
        variant="outline"
        href={resolve("/settings/account")}
        icon="lucide/arrow-left"
      >
        Go Back
      </Button>
    {/snippet}
  </Card>
</article>
