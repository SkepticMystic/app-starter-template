/**
 * Runs a handler over a list, `concurrency` at a time, until the list is exhausted or the
 * deadline passes.
 *
 * The deadline is checked between chunks, never inside one, so a started operation always
 * finishes — a killed upload would leave a partial object behind.
 *
 * Returns each attempted item with its settled outcome; items past the deadline are absent.
 */
export const run_chunked = async <T, R>(input: {
  items: T[];
  concurrency: number;
  /** An absolute `Date.now()` stamp, not a duration. */
  deadline: number;
  handler: (item: T) => Promise<R>;
}): Promise<{ item: T; outcome: PromiseSettledResult<R> }[]> => {
  const results: { item: T; outcome: PromiseSettledResult<R> }[] = [];

  for (
    let i = 0;
    i < input.items.length && Date.now() < input.deadline;
    i += input.concurrency
  ) {
    const chunk = input.items.slice(i, i + input.concurrency);

    // oxlint-disable-next-line no-await-in-loop
    const settled = await Promise.allSettled(chunk.map(input.handler));

    for (const [index, outcome] of settled.entries()) {
      const item = chunk[index];

      if (item !== undefined) results.push({ item, outcome });
    }
  }

  return results;
};
