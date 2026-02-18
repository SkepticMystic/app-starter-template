import type { Snippet } from "svelte";

export type MaybeSnippet<P extends [] = []> = Snippet<P> | string;
