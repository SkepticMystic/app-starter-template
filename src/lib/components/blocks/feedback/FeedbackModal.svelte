<script lang="ts">
  import Button from "#lib/components/ui/button/button.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import Modal from "#lib/components/ui/modal/modal.svelte";
  import Textarea from "#lib/components/ui/textarea/textarea.svelte";
  import { user } from "#lib/stores/session.store.js";
  import { Toast } from "#lib/utils/toast.util.js";
  import { captureFeedback } from "@sentry/sveltekit";
  import { preventDefault } from "svelte/legacy";

  let form = $state({
    name: $user?.name ?? "",
    email: $user?.email ?? "",
    message: "",
  });
</script>

<!-- Sentry user feedback, offered where something just went wrong. -->
<Modal
  title="Send feedback"
  description="Tell us what you were doing when this happened."
>
  {#snippet trigger_child({ props })}
    <Button
      {...props}
      icon="lucide/message-square"
      variant="ghost"
    >
      Send feedback
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
        Toast.info("Thanks for your feedback");
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
            placeholder="What happened?"
            bind:value={form.message}
          />
        {/snippet}
      </Field>

      <Button
        type="submit"
        class="w-full"
      >
        Send
      </Button>
    </form>
  {/snippet}
</Modal>
