<script lang="ts">
  import { TOAST } from "$lib/const/toast.const.js";
  import { toast } from "svelte-daisyui-toast";

  let { data } = $props();

  if (data.search.toast === TOAST.IDS.EMAIL_VERIFIED) {
    toast.success("Email verified successfully!");
  }
</script>

<div class="hero mt-32">
  <div class="hero-content text-center">
    <div class="max-w-lg">
      <h1 class="text-5xl font-bold">Generic App</h1>

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
