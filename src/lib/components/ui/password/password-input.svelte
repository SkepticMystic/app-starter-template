<script lang="ts">
  import { box } from "svelte-toolbelt";
  import Input from "../input/input.svelte";
  import { usePasswordInput } from "./password.svelte.js";
  import type { PasswordInputProps } from "./types.js";

  let {
    ref = $bindable(null),
    value = $bindable(""),
    class: className,
    children,
    ...rest
  }: PasswordInputProps = $props();

  const state = usePasswordInput({
    value: box.with(
      () => value,
      (v) => (value = v),
    ),
  });
</script>

<div class="relative">
  <Input
    {...rest}
    bind:value
    bind:ref
    type={state.root.opts.hidden.current ? "password" : "text"}
    class={[
      "transition-all",
      {
        // either or is mounted (offset 36px)
        "pr-9":
          state.root.passwordState.copyMounted ||
          state.root.passwordState.toggleMounted,
        // both are mounted (offset 36px * 2)
        "pr-[4.5rem]":
          state.root.passwordState.copyMounted &&
          state.root.passwordState.toggleMounted,
      },
      className,
    ]}
  />
  {@render children?.()}
</div>
