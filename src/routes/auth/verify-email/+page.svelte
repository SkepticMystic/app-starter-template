<script lang="ts">
  import { goto } from "$app/navigation";
  import { ROUTES } from "$lib/const/routes.const";
  import { session } from "$lib/stores/session";

  // NOTE: $effect because $session could be pending or refetching
  $effect(() => {
    if ($session.data?.user.emailVerified) {
      goto(ROUTES.HOME);
    }
  });
</script>

<h2 class="text-xl">Please verify your email using the link we sent you</h2>
