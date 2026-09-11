/**
 * v9 ships a real Svelte adapter, so the hand-rolled `createSvelteTable`,
 * `FlexRender` and render helpers this used to carry are gone — they existed
 * only because v8 had no Svelte package.
 */
export {
  FlexRender,
  createTable,
  createTableState,
  renderComponent,
  renderSnippet,
} from "@tanstack/svelte-table";
