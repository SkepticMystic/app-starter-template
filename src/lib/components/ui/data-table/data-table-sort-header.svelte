<script lang="ts">
  import Icon from "$lib/components/icons/Icon.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import type { SortDirection } from "@tanstack/table-core";
  import type { ComponentProps } from "svelte";

  let {
    label,
    sort_dir,
    variant = "ghost",

    ...restProps
  }: ComponentProps<typeof Button> & {
    label?: string;
    sort_dir: SortDirection | false;
  } = $props();
</script>

<Button {variant} {...restProps}>
  {label}
  <Icon
    icon={sort_dir === "desc"
      ? "lucide/arrow-down"
      : sort_dir === "asc"
        ? "lucide/arrow-up"
        : "lucide/arrow-up-down"}
  />
</Button>
