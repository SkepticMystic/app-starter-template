<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import VerifyTwoFactorCodeForm from "#lib/components/form/auth/two_factor/VerifyTwoFactorCodeForm.svelte";
  import Anchor from "#lib/components/ui/anchor/Anchor.svelte";
  import Card from "#lib/components/ui/card/Card.svelte";
  import { redirect_uri_schema } from "#lib/schema/auth/redirect_uri.schema.js";
  import type { ResolvedPathname } from "$app/types";
</script>

<article>
  <Card
    heading="h1"
    title="Two-factor check"
    description="Enter the code from your authenticator app to finish signing in."
    class="mx-auto w-full max-w-xs"
  >
    {#snippet children()}
      <VerifyTwoFactorCodeForm
        on_success={() => {
          // `refreshAll`: the session is new, and the root layout's `page.data.user` is not.
          goto(
            redirect_uri_schema("/home").parse(
              page.url.searchParams.get("redirect_uri") ?? undefined,
            ) as ResolvedPathname,
            { refreshAll: true },
          );
        }}
      />
    {/snippet}

    {#snippet footer()}
      <Anchor href={resolve("auth/two-factor/recover")}>
        Lost your 2FA device? Recover your account
      </Anchor>
    {/snippet}
  </Card>
</article>
