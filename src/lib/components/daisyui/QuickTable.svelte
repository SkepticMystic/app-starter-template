<script lang="ts">
  interface Props {
    rows: Record<string, unknown>[];
    headers?: string[];
    preview?: number;
    indexCol?: boolean;
  }

  let {
    rows,
    headers = $bindable([]),
    preview = 30,
    indexCol = false,
  }: Props = $props();

  headers = headers.length ? headers : Object.keys(rows[0] ?? {});
</script>

<div>
  {#key rows}
    <table class="table">
      <thead>
        <tr>
          {#if indexCol}
            <th>Index</th>
          {/if}
          {#each headers as header (header)}
            <th class="capitalize">{header}</th>
          {/each}
        </tr>
      </thead>

      <tbody>
        {#each rows.slice(0, preview || rows.length) ?? [] as row, i (row.id ?? i)}
          <tr class="hover:bg-base-200">
            {#if indexCol}
              <td>{i + 1}</td>
            {/if}
            {#each headers as header (header)}
              <td>{row[header]}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/key}
</div>
