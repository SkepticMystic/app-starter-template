/**
 * The nav item the current page sits under: its own `href`, or the deepest one the path is
 * beneath, so `/tasks/<id>` lights "Tasks" and `/settings/api-key` lights "API keys" rather than
 * "Settings" too.
 */
export const active_href = <H extends string>(
  path: string,
  hrefs: Iterable<H>,
): H | undefined => {
  let best: H | undefined;

  for (const href of hrefs) {
    const under = path === href || path.startsWith(`${href}/`);
    if (under && href.length > (best?.length ?? 0)) best = href;
  }

  return best;
};
