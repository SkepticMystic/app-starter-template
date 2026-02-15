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
  getter: () => Parameters<typeof form.fields.set>[0],
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

export const FormUtil = {
  init,
  count_issue_metrics,
};
