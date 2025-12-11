<script lang="ts">
  import Icon from "../icon/Icon.svelte";
  import Alert from "./Alert.svelte";

  let {
    flash,
  }: {
    flash: App.PageData["flash"] | undefined;
  } = $props();

  const ICONS = {
    success: "lucide/info",
    warning: "lucide/triangle-alert",
    error: "lucide/x",
  };

  const VARIANTS = {
    success: "default",
    warning: "destructive",
    error: "destructive",
  } as const;
</script>

{#if flash}
  <Alert
    class="mx-auto mb-7 w-full max-w-lg"
    variant={VARIANTS[flash.level]}
  >
    {#snippet title()}
      <Icon
        icon={ICONS[flash.level]}
        label="Note"
      />
    {/snippet}
    {#snippet description()}
      {flash.message}
    {/snippet}
  </Alert>
{/if}
