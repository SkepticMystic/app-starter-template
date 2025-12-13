<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Textarea from "$lib/components/ui/textarea/textarea.svelte";
  import { contact_us_remote } from "$lib/remote/contact/contact.remote";
  import { session } from "$lib/stores/session.store";
  import { onDestroy } from "svelte";
  import { toast } from "svelte-sonner";

  const form = contact_us_remote;

  const session_listener = session.subscribe(($session) => {
    if ($session.data?.user) {
      form.fields.set({
        message: "",
        name: $session.data.user.name,
        email: $session.data.user.email,
      });

      try {
        session_listener();
      } catch (error) {
        console.log("session_listener.error", error);
      }
    }
  });

  onDestroy(() => {
    try {
      session_listener();
    } catch (error) {
      console.log("session_listener.error", error);
    }
  });
</script>

<article class="mx-auto max-w-xs">
  <Card description="Fill out the form below to get in touch.">
    {#snippet title()}
      <header>
        <h1>Contact Us</h1>
      </header>
    {/snippet}

    {#snippet content()}
      <form
        class="space-y-3"
        {...form.enhance(async (e) => {
          await e.submit();

          const res = form.result;
          if (res?.ok) {
            toast.success("Message sent");

            e.form.reset();
          } else if (res?.error) {
            toast.error(res.error.message);
          }
        })}
      >
        <Field
          label="Name"
          field={form.fields.name}
        >
          {#snippet input({ props, field })}
            <Input
              {...props}
              {...field?.as("text")}
              required
              autocomplete="name"
              placeholder="Your name"
            />
          {/snippet}
        </Field>

        <Field
          label="Email"
          field={form.fields.email}
        >
          {#snippet input({ props, field })}
            <Input
              {...props}
              {...field?.as("email")}
              required
              inputmode="email"
              autocomplete="email"
              placeholder="Your email address"
            />
          {/snippet}
        </Field>

        <Field
          label="Message"
          field={form.fields.message}
        >
          {#snippet input({ props, field })}
            <Textarea
              {...props}
              {...field?.as("text")}
              required
              class="max-h-72 min-h-24"
              placeholder="Your message"
            />
          {/snippet}
        </Field>

        <Button
          type="submit"
          class="w-full"
          icon="lucide/send"
          loading={form.pending > 0}
        >
          Send Message
        </Button>
      </form>
    {/snippet}
  </Card>
</article>
