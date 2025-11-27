<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import Alert from "$lib/components/ui/alert/Alert.svelte";
  import ButtonGroup from "$lib/components/ui/button-group/button-group.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { user } from "$lib/stores/session.store";
  import { showReportDialog } from "@sentry/sveltekit";
</script>

<div class="mx-auto max-w-sm">
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

      <ButtonGroup
        class="w-full"
        orientation="vertical"
      >
        <ButtonGroup class="w-full">
          <Button
            href="."
            class="grow"
            variant="outline"
            icon="lucide/arrow-left"
          >
            Go Back
          </Button>
          <Button
            class="grow"
            variant="outline"
            href={resolve("/")}
          >
            Go Home
            <Icon icon="lucide/home" />
          </Button>
        </ButtonGroup>

        <ButtonGroup class="w-full">
          <Button
            class="grow"
            variant="outline"
            icon="lucide/bug"
            onclick={() =>
              showReportDialog({
                user: $user
                  ? { name: $user.name, email: $user.email }
                  : undefined,
              })}
          >
            Submit Feedback
          </Button>
        </ButtonGroup>
      </ButtonGroup>
    </div>
  {/if}
</div>
