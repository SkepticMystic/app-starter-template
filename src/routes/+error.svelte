<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import Alert from "$lib/components/ui/alert/Alert.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
</script>

<div class="mx-auto flex h-svh max-w-sm items-center">
  {#if page?.error}
    <div class="flex flex-col gap-2">
      <Alert
        variant="destructive"
        class="border-destructive/50"
      >
        {#snippet title()}
          <Icon
            icon="lucide/message-circle-warning"
            label={page.status.toString()}
          />
        {/snippet}

        {#snippet description()}
          <p>{page.error!.message || "Something went wrong"}</p>
        {/snippet}
      </Alert>

      <section class="flex w-full flex-row gap-2">
        <Button
          class="grow"
          variant="outline"
          href={resolve("/")}
        >
          Go Home
        </Button>
        <Button
          class="grow"
          variant="outline"
          href={resolve(".")}
        >
          Go Back
        </Button>
      </section>
    </div>
  {/if}
</div>
