<script lang="ts">
  import { dev } from "$app/environment";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";

  let { data } = $props();

  let user = $derived(data.user);
</script>

<article>
  <header>
    <h1>Profile</h1>
  </header>

  <section class="flex items-center gap-3">
    <UserAvatar
      {user}
      class="size-14"
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
</article>
