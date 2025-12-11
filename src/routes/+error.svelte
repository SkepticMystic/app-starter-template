<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import Alert from "$lib/components/ui/alert/Alert.svelte";
  import ButtonGroup from "$lib/components/ui/button-group/button-group.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Modal from "$lib/components/ui/modal/modal.svelte";
  import Textarea from "$lib/components/ui/textarea/textarea.svelte";
  import { user } from "$lib/stores/session.store";
  import { captureFeedback } from "@sentry/sveltekit";
  import { toast } from "svelte-sonner";
  import { preventDefault } from "svelte/legacy";

  let form = $state({
    name: $user?.name ?? "",
    email: $user?.email ?? "",
    message: "",
  });
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
          <Modal
            title="Send Feedback"
            description="Help us improve the app by sending us feedback"
          >
            {#snippet trigger_child({ props })}
              <Button
                {...props}
                class="w-full"
                icon="lucide/bug"
                variant="secondary"
              >
                Send Feedback
              </Button>
            {/snippet}

            {#snippet content({ close })}
              <form
                class="flex flex-col gap-3"
                onsubmit={preventDefault(() => {
                  captureFeedback({
                    name: form.name,
                    email: form.email,
                    message: form.message,
                  });

                  close();
                  toast.info("Thanks for your feedback!");
                })}
              >
                <Field label="Name">
                  {#snippet input({ props })}
                    <Input
                      {...props}
                      autocomplete="name"
                      bind:value={form.name}
                    ></Input>
                  {/snippet}
                </Field>

                <Field label="Email">
                  {#snippet input({ props })}
                    <Input
                      {...props}
                      type="email"
                      autocomplete="email"
                      bind:value={form.email}
                    ></Input>
                  {/snippet}
                </Field>

                <Field label="Message">
                  {#snippet input({ props })}
                    <Textarea
                      {...props}
                      required
                      placeholder="Please describe your issue"
                      bind:value={form.message}
                    />
                  {/snippet}
                </Field>

                <Button
                  type="submit"
                  class="w-full"
                  icon="lucide/send"
                >
                  Send
                </Button>
              </form>
            {/snippet}
          </Modal>
        </ButtonGroup>
      </ButtonGroup>
    </div>
  {/if}
</div>
