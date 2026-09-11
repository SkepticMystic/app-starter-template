import type { MaybePromise } from "$lib/interfaces";
import { Toast, type ToastMessage } from "$lib/utils/toast.util";
import * as Sentry from "@sentry/sveltekit";
import type {
  RemoteForm,
  RemoteFormInput,
  RemoteFormIssue,
} from "@sveltejs/kit";

const count_issue_metrics = (
  form: { fields: { allIssues: () => RemoteFormIssue[] | undefined } },
  name: string,
) => {
  form.fields.allIssues()?.forEach((issue) => {
    Sentry.metrics.count(name + ".issue", 1, {
      unit: "issue",
      attributes: { issue },
    });
  });
};

const init = <T extends RemoteFormInput, R = unknown>(
  form: RemoteForm<T, R>,
  getter: () => T,
) => {
  let hydrated = false;

  form.fields.set(getter());

  $effect(() => {
    const values = getter();

    if (!hydrated) {
      hydrated = true;
      return;
    }

    form.fields.set(values);
  });
};

/**
 * The whole submit-then-report lifecycle, in one call: submit, count the field
 * issues, read the result, toast, run `on_success`.
 *
 * Every enhanced form in this repo wrote this body out, and they did not agree
 * — some called `count_issue_metrics` and some did not, and whether the two
 * that skipped it were opting out or had simply forgotten is not answerable
 * from the code. It is now one argument.
 *
 * The parameter is `Omit<RemoteForm<...>, "for">` so that a KEYED instance
 * (`form.for(id)`) fits: a form rendered once per row has to be keyed, or every
 * row shares one `result` and one `pending`.
 *
 * `suc_msg` takes a `ToastMessage`, not just a string, so a two-line toast does
 * not mean abandoning the helper and hand-rolling the body again.
 */
const enhance = <T extends RemoteFormInput, D>(
  form: Omit<RemoteForm<T, App.Result<D>>, "for">,
  opts?: {
    /** Name to count field issues under. Omit to skip the metric. */
    metric?: string;
    suc_msg?: ToastMessage | ((data: D) => ToastMessage);
    on_success?: (data: D) => MaybePromise<unknown>;
  },
) =>
  form.enhance(async ({ submit }) => {
    await submit();

    if (opts?.metric) count_issue_metrics(form, opts.metric);

    const res = form.result;
    if (!res) return;

    if (res.ok) {
      if (opts?.suc_msg) {
        Toast.success(
          typeof opts.suc_msg === "function"
            ? opts.suc_msg(res.data)
            : opts.suc_msg,
        );
      }

      await opts?.on_success?.(res.data);
    } else {
      Toast.err(res.error);
    }
  });

export const FormUtil = {
  init,
  enhance,
  count_issue_metrics,
};
