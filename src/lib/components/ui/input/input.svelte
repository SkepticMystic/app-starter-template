<script lang="ts">
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.type";
  import type { ComponentProps } from "svelte";
  import Icon from "../icon/Icon.svelte";
  import InputGroupAddon, {
    type InputGroupAddonAlign,
  } from "../input-group/input-group-addon.svelte";
  import InputGroupInput from "../input-group/input-group-input.svelte";
  import InputGroupText from "../input-group/input-group-text.svelte";
  import InputGroup from "../input-group/input-group.svelte";
  import InputRoot from "./input-root.svelte";

  let {
    icon,
    addon,
    ref = $bindable(null),
    value = $bindable(),
    class: klass,
    align = "inline-end",
    ...restProps
  }: ComponentProps<typeof InputRoot> & {
    icon?: string;
    addon?: MaybeSnippet;
    align?: InputGroupAddonAlign;
  } = $props();
</script>

{#if icon || addon}
  <InputGroup class={klass}>
    <InputGroupInput
      bind:value
      {...restProps}
    />

    <InputGroupAddon {align}>
      {#if icon}
        <Icon {icon} />
      {:else if typeof addon === "string"}
        <InputGroupText>{addon}</InputGroupText>
      {:else if addon}
        {@render addon()}
      {/if}
    </InputGroupAddon>
  </InputGroup>
{:else}
  <InputRoot
    bind:ref
    bind:value
    class={klass}
    {...restProps}
  />
{/if}
