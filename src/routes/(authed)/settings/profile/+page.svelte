<script lang="ts">
  import { dev } from "$app/env";
  import Header from "#lib/components/ui/header/Header.svelte";
  import UpdateUserForm from "#lib/components/form/auth/user/UpdateUserForm.svelte";
  import UserAvatar from "#lib/components/ui/avatar/UserAvatar.svelte";

  let { data } = $props();

  let user = $derived(data.account);
</script>

<article>
  <Header title="Profile" />

  <section class="flex items-center gap-3">
    <UserAvatar
      {user}
      size={56}
    />

    <div>
      {#if user.name}
        <p>
          <strong>{user.name}</strong>
        </p>
      {/if}
      <p>{user.email}</p>
      {#if dev}
        <code>{user.id}</code>
      {/if}
    </div>
  </section>

  <UpdateUserForm initial={user} />
</article>
