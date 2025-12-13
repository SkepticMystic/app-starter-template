<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { OrganizationClient } from "$lib/clients/auth/organization.client";
  import Anchor from "$lib/components/ui/anchor/Anchor.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { App } from "$lib/utils/app.js";
  import { toast } from "svelte-sonner";

  let { data } = $props();

  const redirect_uri = resolve("/auth/organization/accept-invite");

  const accept_invite = async () => {
    if (!data.search.invite_id) return;

    const res = await OrganizationClient.invitation.accept(
      data.search.invite_id,
    );
    if (res.ok) {
      await goto(resolve("/"));
    } else {
      toast.error(res.error.message);
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
      <Anchor
        class="btn btn-secondary"
        href={App.url("/auth/signup", { redirect_uri })}
      >
        Signup
      </Anchor>
    </div>
  {:else if data.prompt === "wrong_account"}
    <p>
      You are logged in with the wrong account. Please login or signup with the
      same email address that the invitation was sent to:
    </p>

    <div class="flex gap-2">
      <Anchor href={App.url("/auth/signin", { redirect_uri })}>Login</Anchor>
      <Anchor
        class="btn btn-secondary"
        href={App.url("/auth/signup", { redirect_uri })}
      >
        Signup
      </Anchor>
    </div>
  {:else if data.prompt === "already_member"}
    <p class="">You are already a member of the organization.</p>

    <Anchor href={resolve("/organization")}>View Organization</Anchor>
  {:else if data.prompt === "invite_not_pending"}
    <p class="text-error">
      The invitation is no longer pending. Please contact the inviter for more
      details.
    </p>
  {:else if data.prompt === "invite_expired"}
    <p class="text-error">
      The invitation has expired. Please contact the inviter for a new
      invitation.
    </p>
  {:else if data.prompt === "invalid_invite_id"}
    <p class="text-error">
      The invitation link is invalid. Please check the link or contact the
      inviter.
    </p>
  {:else}
    <p class="text-error">Invalid prompt type.</p>
  {/if}
</article>
