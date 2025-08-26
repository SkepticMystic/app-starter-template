<script lang="ts">
  import QuickTable from "$lib/components/daisyui/QuickTable.svelte";

  let { data } = $props();
</script>

<QuickTable rows={data.users} />
