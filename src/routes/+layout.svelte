<script lang="ts">
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Navbar from "$lib/components/daisyui/Navbar.svelte";
  import { session } from "$lib/stores/session";
  import { onMount } from "svelte";
  import { toast, Toaster } from "svelte-daisyui-toast";
  import { themeChange } from "theme-change";
  import "../app.css";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  toast.defaults.set({ clear_on_navigate: true, duration_ms: 10_000 });

  let loading = $state(true);
  onMount(async () => {
    themeChange(false);

    // if (
    //   $user &&
    //   $session.data?.session &&
    //   !$session.data.session.activeOrganizationId
    // ) {
    //   console.log("Creating organization for user:", $user.email);

    //   const org_res = await AuthClient.organization.create({
    //     slug: $user.email,
    //     name: "My Organization",
    //     keepCurrentActiveOrganization: false,
    //   });

    //   if (org_res.error) {
    //     console.warn("org_res.error", org_res.error);
    //     return toast.warning(
    //       org_res.error.message ?? "Org creation failed. Please try again.",
    //     );
    //   }

    //   const active_res = await AuthClient.organization.setActive({
    //     organizationId: org_res.data.id,
    //   });

    //   if (active_res.error) {
    //     console.warn("active_res.error", active_res.error);
    //     return toast.warning(
    //       active_res.error.message ??
    //         "Set active org failed. Please try again.",
    //     );
    //   }
    // }

    loading = false;
  });

  $effect(() => {
    if ($session.isRefetching) {
      console.log("$session refetching...");
    } else if ($session.isPending) {
      console.log("$session pending...");
    } else {
      console.log("$session loaded", $session.data);
    }
  });
</script>

<header>
  <Navbar />
</header>

<main class="mx-auto my-6 max-w-6xl px-3">
  <Loading {loading}>
    {@render children?.()}
  </Loading>
</main>

<Toaster />
