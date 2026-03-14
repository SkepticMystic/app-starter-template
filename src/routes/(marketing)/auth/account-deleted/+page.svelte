<script lang="ts">
  import { resolve } from "$app/paths";
  import Alert from "$lib/components/ui/alert/Alert.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
</script>

<div class="mx-auto flex h-3/4 max-w-sm items-center">
  <div class="flex flex-col gap-2">
    <Alert>
      {#snippet title()}
        <Icon
          icon="lucide/check"
          label="Account deleted"
        />
      {/snippet}

      {#snippet description()}
        <p>
          Your account has been deleted, and all associated data has been
          permanently removed.
        </p>
      {/snippet}
    </Alert>

    <Button
      class="w-full"
      variant="outline"
      href={resolve("/")}
    >
      Go Home
    </Button>
  </div>
</div>
