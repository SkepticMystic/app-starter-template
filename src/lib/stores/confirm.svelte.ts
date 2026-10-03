import { browser } from "$app/env";

export type ConfirmRequest = {
  /** The question, sentence case: "Delete this script?" */
  title: string;
  /** What follows from saying yes. Never restates the title. */
  description?: string;
  /** The confirm button's word. "Continue" by default — a verb that matches the title beats it. */
  action_label?: string;
  destructive?: boolean;
  /**
   * Text the user must type back before the action enables — for an irreversible action
   * whose size is the point (a bulk delete types its row count). Implies `destructive`.
   */
  type_to_confirm?: string;
  /**
   * When the typed text counts as {@link type_to_confirm}; exact equality by default. For a value
   * people write more than one way — a phone number typed `082 123 4567` against `+27821234567`.
   */
  matches?: (typed: string) => boolean;
};

/**
 * A `confirm`/`prompt` string from {@link Client.wrap} into a dialog's two lines. Every one of
 * them is written "Question? What it means.", so the first question is the title and the rest
 * is the description; a string with no question in the middle is a description under a stock
 * title rather than a paragraph of title.
 */
const from_message = (message: string): ConfirmRequest => {
  const split = message.indexOf("? ");
  if (split !== -1) {
    return {
      title: message.slice(0, split + 1),
      description: message.slice(split + 2),
    };
  }

  return message.endsWith("?") && message.length <= 80
    ? { title: message }
    : { title: "Are you sure?", description: message };
};

/**
 * The app's one confirmation dialog, asked imperatively and answered by `Confirm.svelte`,
 * which the root layout mounts once — the way `Toast` is called and `<Sonner />` renders it.
 *
 * **It replaces `window.confirm` and `window.prompt`**, which are unstyled, cannot say more
 * than one string, and block the page's JavaScript — timers and sockets included — while
 * open.
 *
 * **`open` and `request` are separate on purpose.** Settling closes the dialog but leaves the
 * request in place, so the closing animation shows the words it opened with instead of
 * emptying mid-fade.
 */
class ConfirmStore {
  open = $state(false);
  request = $state<ConfirmRequest | null>(null);
  /** What has been typed toward {@link ConfirmRequest.type_to_confirm}. Reset per ask. */
  typed = $state("");

  from_message = from_message;

  /** A plain field, not `$state`: nothing renders it, and the host reads it only to settle. */
  #resolve: ((ok: boolean) => void) | null = null;
  /**
   * What had focus when the ask began — almost always the button that asked. bits-ui's own
   * restore cannot land there: `Button` is disabled while its `onclick` awaits this, so focus
   * fell to `<body>`. The host puts it back once the button has had a frame to re-enable.
   */
  return_focus: HTMLElement | null = null;
  /** How many hosts are mounted. With none, an ask would wait on a dialog nobody draws. */
  #hosts = 0;

  /**
   * Resolves `true` only on the confirm button (or Enter, once any `type_to_confirm`
   * matches). Escape, Cancel and a newer ask all resolve `false`.
   */
  ask = (request: ConfirmRequest | string): Promise<boolean> => {
    // Only ever called from a click handler, but a module singleton is shared across every
    // request on the server: refusing there means no state is ever written to it.
    if (!browser) return Promise.resolve(false);

    const resolved =
      typeof request === "string" ? from_message(request) : request;

    if (this.#hosts === 0) {
      // A page rendered outside the root layout. Degrade to the native dialogs, not a hang.
      const text = [resolved.title, resolved.description]
        .filter(Boolean)
        .join("\n\n");
      if (!resolved.type_to_confirm) return Promise.resolve(confirm(text));

      const typed = prompt(
        `${text}\n\nType "${resolved.type_to_confirm}" to confirm`,
      );
      this.typed = typed ?? "";

      return Promise.resolve(typed !== null && this.matches(resolved, typed));
    }

    // One dialog at a time: a second ask while the first is open answers the first "no",
    // rather than queueing a question the user may no longer be expecting.
    this.settle(false);

    this.request = resolved;
    this.typed = "";
    this.return_focus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    this.open = true;

    return new Promise((resolve) => {
      this.#resolve = resolve;
    });
  };

  /**
   * {@link ask} for a {@link ConfirmRequest.type_to_confirm}, resolving to what was typed, or
   * `null` on any "no". **Send the server this, never the target.** Where the server re-checks
   * the typed text, passing it the target makes that check compare the target with itself, and
   * leaves only {@link ConfirmRequest.matches} — which may be looser on purpose — as the gate.
   */
  ask_typed = async (
    request: ConfirmRequest & { type_to_confirm: string },
  ): Promise<string | null> => ((await this.ask(request)) ? this.typed : null);

  /** Whether `typed` answers the request's {@link ConfirmRequest.type_to_confirm}. */
  matches = (request: ConfirmRequest, typed: string) =>
    request.type_to_confirm === undefined ||
    (request.matches?.(typed) ?? typed === request.type_to_confirm);

  /** Idempotent: a Cancel click and the `onOpenChange` it causes settle once between them. */
  settle = (ok: boolean) => {
    const resolve = this.#resolve;
    this.#resolve = null;
    this.open = false;

    resolve?.(ok);
  };

  /** Called by `Confirm.svelte`'s lifecycle; the returned cleanup unregisters it. */
  register_host = () => {
    this.#hosts += 1;

    return () => {
      this.#hosts -= 1;
      this.settle(false);
    };
  };
}

export const Confirm = new ConfirmStore();
