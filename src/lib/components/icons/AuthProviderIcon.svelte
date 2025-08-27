<script lang="ts">
  import type { IAuth } from "$lib/const/auth.const";
  import type { ClassValue } from "svelte/elements";
  import Icon from "./Icon.svelte";

  let {
    provider_id,
    class: klass = "",
  }: {
    provider_id: IAuth.ProviderId;
    class?: ClassValue;
  } = $props();
</script>

{#if provider_id === "google"}
  <Icon class="devicon-plain/google {klass}" />
{:else if provider_id === "credential"}
  <Icon class="heroicons/envelope {klass}" />
{:else if provider_id === "pocket-id"}
  <Icon class="heroicons/key {klass}" />
{/if}
