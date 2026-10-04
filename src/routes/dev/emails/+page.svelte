<script lang="ts">
  import { resolve } from "$app/paths";
  import ButtonGroup from "#lib/components/ui/button-group/button-group.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Header from "#lib/components/ui/header/Header.svelte";
  import Page from "#lib/components/ui/layout/Page.svelte";

  let { data } = $props();

  let selected = $state(0);
  let format = $state<"html" | "text">("html");
  let width = $state<600 | 375>(600);
  let scheme = $state<"light" | "dark">("light");

  const email = $derived(data.emails[selected]);
  const src = $derived(
    email
      ? `${resolve("/dev/emails/[type]", { type: email.type })}${format === "text" ? "?format=text" : ""}`
      : undefined,
  );
</script>

<Page width="full">
  <Header
    title="Emails"
    description="Every template, rendered with its fixture from email.fixtures.ts. Dev only."
  />

  <div class="flex flex-col gap-4 lg:flex-row">
    <nav class="flex shrink-0 flex-col gap-1 lg:w-64">
      {#each data.emails as item, i (item.type)}
        <Button
          variant={i === selected ? "secondary" : "ghost"}
          class="justify-start font-mono text-xs"
          label={item.type}
          onclick={() => (selected = i)}
        />
      {/each}
    </nav>

    {#if email}
      <section class="min-w-0 grow space-y-3">
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt class="text-muted-foreground">Subject</dt>
          <dd class="font-medium">{email.subject}</dd>
          <dt class="text-muted-foreground">Preheader</dt>
          <dd>{email.preheader}</dd>
          <dt class="text-muted-foreground">To</dt>
          <dd>{email.to}</dd>
          {#if email.reply_to}
            <dt class="text-muted-foreground">Reply-to</dt>
            <dd>{email.reply_to}</dd>
          {/if}
        </dl>

        <div class="flex flex-wrap gap-2">
          <ButtonGroup>
            <Button
              size="sm"
              variant={format === "html" ? "secondary" : "outline"}
              label="HTML"
              onclick={() => (format = "html")}
            />
            <Button
              size="sm"
              variant={format === "text" ? "secondary" : "outline"}
              label="Text"
              onclick={() => (format = "text")}
            />
          </ButtonGroup>
          <ButtonGroup>
            <Button
              size="sm"
              variant={width === 600 ? "secondary" : "outline"}
              label="Desktop"
              onclick={() => (width = 600)}
            />
            <Button
              size="sm"
              variant={width === 375 ? "secondary" : "outline"}
              label="Mobile"
              onclick={() => (width = 375)}
            />
          </ButtonGroup>
          <ButtonGroup>
            <Button
              size="sm"
              variant={scheme === "light" ? "secondary" : "outline"}
              label="Light"
              onclick={() => (scheme = "light")}
            />
            <Button
              size="sm"
              variant={scheme === "dark" ? "secondary" : "outline"}
              label="Dark"
              onclick={() => (scheme = "dark")}
            />
          </ButtonGroup>
        </div>

        <!-- The frame's `color-scheme` is what `prefers-color-scheme` reads inside it. -->
        <iframe
          title="{email.type} preview"
          {src}
          class="h-[75vh] max-w-full rounded-lg border bg-white"
          style:width="{width + 64}px"
          style:color-scheme={scheme}
        ></iframe>
      </section>
    {/if}
  </div>
</Page>
