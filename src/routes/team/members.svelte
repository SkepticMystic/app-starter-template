<script lang="ts">
  import type { Member } from "$lib/models/auth/Member.model";
  import MemberCard from "./memberCard.svelte";

  interface Props {
    members: Member[];
  }

  let { members }: Props = $props();
</script>

<div class="flex gap-3">
  {#each members as member}
    <MemberCard {member} />
  {/each}
</div>
