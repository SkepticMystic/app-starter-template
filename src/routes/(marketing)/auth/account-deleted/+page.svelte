<script lang="ts">
  import { resolve } from "$app/paths";
  import Button from "#lib/components/ui/button/button.svelte";
  import Icon from "#lib/components/ui/icon/Icon.svelte";
</script>

<div class="mx-auto flex h-3/4 max-w-sm items-center">
  <div class="flex flex-col gap-3">
    <h1 class="flex items-center gap-2">
      <Icon icon="lucide/check" />
      Account deleted
    </h1>

    <p class="text-muted-foreground">
      Your account has been deleted, and all associated data has been
      permanently removed.
    </p>

    <Button
      class="w-full"
      variant="outline"
      href={resolve("")}
    >
      Go home
    </Button>
  </div>
</div>
