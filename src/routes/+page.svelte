<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { APP } from "$lib/const/app.js";
</script>

<div class="mx-auto mt-32 flex max-w-lg flex-col items-center">
  <h1>{APP.NAME}</h1>

  <div class="my-14 flex flex-wrap gap-2">
    <Button href="/tasks">Tasks</Button>
    <Button href="/profile" variant="secondary">Profile</Button>
    <Button href="/organization" variant="outline">Team</Button>
  </div>
</div>
