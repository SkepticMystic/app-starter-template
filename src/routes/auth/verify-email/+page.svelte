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

<h2>Verify your email address</h2>

<p>
  A verification link has been sent to your email address. Please check your
  inbox and click the link to verify your email.
</p>
