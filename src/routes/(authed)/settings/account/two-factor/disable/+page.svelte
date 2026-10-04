<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import Header from "#lib/components/ui/header/Header.svelte";
  import DisableTwoFactorForm from "#lib/components/form/auth/two_factor/DisableTwoFactorForm.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Card from "#lib/components/ui/card/Card.svelte";
</script>

<article>
  <Header
    title="Disable two-factor authentication"
    back={{ href: resolve("/(authed)/settings/account"), label: "Account" }}
  />

  <Card>
    {#snippet children()}
      <DisableTwoFactorForm
        on_success={async () => {
          await goto(resolve("settings/account"));
        }}
      />
    {/snippet}

    {#snippet footer()}
      <Button
        variant="outline"
        href={resolve("settings/account")}
        icon="lucide/arrow-left"
      >
        Go back
      </Button>
    {/snippet}
  </Card>
</article>
