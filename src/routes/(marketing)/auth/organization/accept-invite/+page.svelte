<script lang="ts">
  import { resolve } from "$app/paths";
  import { Toast } from "$lib/utils/toast.util";
  import { OrganizationClient } from "$lib/clients/auth/organization.client";
  import Anchor from "$lib/components/ui/anchor/Anchor.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { UserClient } from "$lib/clients/auth/user.client";
  import { App } from "$lib/utils/app.js";

  let { data } = $props();

  /**
   * Keeps `invite_id`. `resolve()` alone dropped it, so signing in landed the
   * reader back on this page with no invitation to accept — which looked like
   * the link had expired.
   */
  const redirect_uri = $derived(
    App.url("/auth/organization/accept-invite", {
      invite_id: data.search.invite_id,
    }),
  );

  /**
   * Signing out and coming back. A plain "Login" link is no use to somebody who
   * is already signed in as the wrong person, and `goto` will not re-run the
   * load with the old cookie gone — so this is a hard navigation.
   */
  const switch_account = async () => {
    await UserClient.signout();

    globalThis.location.href = App.url("/auth/signin", { redirect_uri });
  };

  const accept_invite = async () => {
    if (!data.search.invite_id) return;

    const res = await OrganizationClient.invitation.accept(
      data.search.invite_id,
    );
    if (res.ok) {
      // NOTE: Hard reload to trigger session update
      globalThis.location.href = App.url("/settings/organization");
    } else {
      Toast.err(res.error);
    }
  };
</script>

<article>
  <header>
    <h1>Accept Invitation</h1>
  </header>

  {#if data.prompt === "accept_invite"}
    <p>
      You've been invited by <strong>
        {data.inviter.name ?? data.inviter.email}
      </strong>
      to join the org:
      <strong>{data.organization.name}</strong>.
    </p>

    <Button
      onclick={accept_invite}
      icon="lucide/check-circle"
    >
      Accept Invite
    </Button>
  {:else if data.prompt === "signup_login"}
    <p>Please login or signup to accept the invitation.</p>

    <div class="flex gap-2">
      <Anchor href={App.url("/auth/signin", { redirect_uri })}>Login</Anchor>
      <Anchor href={App.url("/auth/signup", { redirect_uri })}>Signup</Anchor>
    </div>
  {:else if data.prompt === "wrong_account"}
    <p>
      You are signed in with a different account. This invitation was sent to
      <strong>{data.invited_email}</strong>.
    </p>

    <div class="flex gap-2">
      <Button onclick={switch_account}>Sign out and switch account</Button>
      <Anchor href={App.url("/auth/signup", { redirect_uri })}>Signup</Anchor>
    </div>
  {:else if data.prompt === "email_not_verified"}
    <p class="text-warning">
      Verify <strong>{data.email}</strong> before accepting this invitation — we sent
      you a link when you signed up.
    </p>

    <Anchor href={resolve("/auth/verify-email")}>Resend verification</Anchor>
  {:else if data.prompt === "already_member"}
    <p>You are already a member of the organization.</p>

    <Anchor href={resolve("/settings/organization")}>View Organization</Anchor>
  {:else if data.prompt === "invite_not_pending"}
    <p class="text-warning">
      The invitation is no longer pending. Please contact the inviter for more
      details.
    </p>
  {:else if data.prompt === "invite_expired"}
    <p class="text-warning">
      The invitation has expired. Please contact the inviter for a new
      invitation.
    </p>
  {:else if data.prompt === "invalid_invite_id"}
    <p class="text-warning">
      The invitation link is invalid. Please check the link or contact the
      inviter.
    </p>
  {:else}
    <p class="text-warning">Invalid prompt type.</p>
  {/if}
</article>
