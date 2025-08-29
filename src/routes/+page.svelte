<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { APP } from "$lib/const/app.js";
</script>

<div class="hero mt-32">
  <div class="hero-content text-center">
    <div class="max-w-lg">
      <h1>{APP.NAME}</h1>

      <div class="my-14 flex flex-wrap justify-center gap-5">
        <Button href="/projects">Projects</Button>
        <Button href="/about" variant="outline">About</Button>
      </div>
    </div>
  </div>
</div>
