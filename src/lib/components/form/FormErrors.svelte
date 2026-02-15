<script lang="ts">
  import type { RemoteFormIssue } from "@sveltejs/kit";
  import FieldError from "../ui/field/field-error.svelte";

  let {
    form,
  }: {
    form: { fields: { allIssues: () => RemoteFormIssue[] | undefined } };
  } = $props();
</script>

<!-- Show only the top-level form issues. 
 The field-specific issues are handled by Field.svelte -->
<FieldError
  errors={form.fields.allIssues()?.filter((e) => e.path.length === 0)}
/>
