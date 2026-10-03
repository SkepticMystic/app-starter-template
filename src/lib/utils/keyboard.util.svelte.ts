import { onMount } from "svelte";
import { is_apple_keyboard } from "./keyboard.util";

/**
 * Whether to label shortcuts for an Apple keyboard (`chord_label`). `false` until
 * mounted, so the server's `Ctrl` and the hydrating render agree, then read once off `navigator`.
 * Call it while a component initialises.
 */
export const apple_keyboard = () => {
  let current = $state(false);

  onMount(() => {
    current = is_apple_keyboard(navigator);
  });

  return {
    get current() {
      return current;
    },
  };
};
