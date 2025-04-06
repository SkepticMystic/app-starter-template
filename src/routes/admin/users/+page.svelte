<script lang="ts">
  import Table from "$lib/components/daisyui/QuickTable.svelte";

  let { data } = $props();
</script>

<Table rows={data.users} />
