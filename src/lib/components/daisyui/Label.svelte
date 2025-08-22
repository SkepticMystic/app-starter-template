<script lang="ts">
  interface Props {
    lbl: string;
    class?: string;
    children?: import("svelte").Snippet;
  }

  let { lbl, class: klass = "", children }: Props = $props();
</script>

<!-- SOURCE: https://daisyui.com/components/label/#floating-label -->
<label class="floating-label {klass}">
  <span>{lbl}</span>

  {@render children?.()}
</label>
