<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { OrganizationsClient } from "$lib/clients/organizations.client.js";
  import Icon from "$lib/components/icons/Icon.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { ROUTES } from "$lib/const/routes.const.js";
  import { TOAST } from "$lib/const/toast.const.js";
  import { App } from "$lib/utils/app.js";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { Url } from "$lib/utils/urls.js";

  let { data } = $props();

  const loader = Loader<"accept_invite">();
  const redirect_uri = Url.strip_origin(page.url);

  const accept_invite = async () => {
    if (!data.invitation) {
      return;
    }

    loader.load("accept_invite");

    const res = await OrganizationsClient.accept_invitation(data.invitation.id);
    if (res.ok) {
      await goto(
        App.url(ROUTES.HOME, { toast: TOAST.IDS.ORG_INVITE_ACCEPTED }),
      );
    }

    loader.reset();
  };
</script>

<div class="space-y-3">
  <h2>Accept Invitation</h2>

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
      icon="heroicons/check-circle"
      disabled={any_loading($loader)}
      loading={$loader["accept_invite"]}
    >
      Accept Invite
    </Button>
  {:else if data.prompt === "signup_login"}
    <p>Please login or signup to accept the invitation.</p>

    <div class="flex gap-2">
      <a
        class="btn btn-primary"
        href={App.url(ROUTES.AUTH_SIGNIN, { redirect_uri })}
      >
        Login
      </a>
      <a
        class="btn btn-secondary"
        href={App.url(ROUTES.AUTH_SIGNUP, { redirect_uri })}
      >
        Signup
      </a>
    </div>
  {:else if data.prompt === "wrong_account"}
    <p>
      You are logged in with the wrong account. Please login or signup with the
      same email address that the invitation was sent to:
    </p>

    <div class="flex gap-2">
      <a
        class="btn btn-primary"
        href={App.url(ROUTES.AUTH_SIGNIN, { redirect_uri })}
      >
        Login
      </a>
      <a
        class="btn btn-secondary"
        href={App.url(ROUTES.AUTH_SIGNUP, { redirect_uri })}
      >
        Signup
      </a>
    </div>
  {:else if data.prompt === "already_member"}
    <p class="">You are already a member of the organization.</p>

    <a class="btn btn-primary" href={ROUTES.ORGANIZATION}>
      View Organization
    </a>
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
</div>
