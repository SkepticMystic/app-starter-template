<script lang="ts">
  let {
    person,
    fallback,
  }: {
    person: { name: string; email: string } | null | undefined;
    /** What stands in for nobody: "—", "Deleted user", "You". */
    fallback: string;
  } = $props();
</script>

{#if person}
  <div class="flex min-w-0 flex-col">
    <span class="truncate">{person.name}</span>
    <span class="truncate text-xs text-muted-foreground">{person.email}</span>
  </div>
{:else}
  <span class="text-muted-foreground">{fallback}</span>
{/if}
