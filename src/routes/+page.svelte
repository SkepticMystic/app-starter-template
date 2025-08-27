<script lang="ts">
  import { APP } from "$lib/const/app.js";
</script>

<div class="hero mt-32">
  <div class="hero-content text-center">
    <div class="max-w-lg">
      <h1>{APP.NAME}</h1>

      <div class="my-14 flex flex-wrap justify-center gap-5">
        <a href="/projects">
          <button class="btn btn-primary">Projects</button>
        </a>
        <a href="/tasks">
          <button class="btn btn-secondary">Tasks</button>
        </a>
      </div>
    </div>
  </div>
</div>
