<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { organizations } from "$lib/stores/organizations.store";
  import { Loader } from "$lib/utils/loader";

  let loader = Loader<"set_active">();

  const set_active = async (organizationId: string) => {
    loader.load("set_active");

    await OrganizationsClient.set_active(organizationId);

    loader.reset();
  };
</script>

{#if $organizations.isPending}
  <Loading loading></Loading>
{:else if !$organizations.data}
  <p>No organizations found.</p>
{:else if $organizations.data.length > 0}
  <Label lbl="Select Organization">
    <select
      class="select"
      disabled={$loader["set_active"]}
      on:change={(e) => set_active(e.currentTarget.value)}
    >
      {#each $organizations.data as org}
        <option value={org.id}>
          {org.name}
        </option>
      {/each}
    </select>
  </Label>
{/if}
