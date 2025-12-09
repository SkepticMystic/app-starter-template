<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util";
  import qrcode from "qrcode-generator";
  import type { Snippet } from "svelte";

  let {
    value,
    size = 128,
    color = "#000000",
    backgroundColor = "#FFFFFF",
    errorCorrection = "M",
    margin = 2,
    class: className,
    logo,
    logoSize = 0.2,
  }: {
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    errorCorrection?: "L" | "M" | "Q" | "H";
    margin?: number;
    class?: string;
    logo?: string | Snippet;
    logoSize?: number;
  } = $props();

  let matrix = $derived.by(() => {
    if (!value) return [];
    try {
      const qr = qrcode(0, errorCorrection);
      qr.addData(value);
      qr.make();

      const count = qr.getModuleCount();
      const rows = [];
      for (let r = 0; r < count; r++) {
        const row = [];
        for (let c = 0; c < count; c++) {
          row.push(qr.isDark(r, c));
        }
        rows.push(row);
      }
      return rows;
    } catch (e) {
      console.error("QR Generation failed", e);
      return [];
    }
  });

  let moduleCount = $derived(matrix.length);
  let viewBoxSize = $derived(moduleCount + margin * 2);
</script>

<div
  class={cn(
    "relative inline-flex shrink-0 items-center justify-center",
    className,
  )}
  style:width={`${size}px`}
  style:height={`${size}px`}
>
  <svg
    viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
    xmlns="http://www.w3.org/2000/svg"
    shape-rendering="crispEdges"
    class="h-full w-full"
  >
    <rect
      width={viewBoxSize}
      height={viewBoxSize}
      fill={backgroundColor}
    />

    {#each matrix as row, r}
      {#each row as bit, c}
        {#if bit}
          <rect
            x={c + margin}
            y={r + margin}
            width="1"
            height="1"
            fill={color}
          />
        {/if}
      {/each}
    {/each}
  </svg>

  {#if logo}
    <div
      class="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background p-1 shadow-sm"
      style:width={`${size * logoSize}px`}
      style:height={`${size * logoSize}px`}
    >
      {#if typeof logo === "string"}
        <img
          src={logo}
          alt="QR Logo"
          class="h-full w-full object-contain"
        />
      {:else}
        {@render logo()}
      {/if}
    </div>
  {/if}
</div>
