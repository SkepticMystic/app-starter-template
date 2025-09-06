<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Loading from "$lib/components/ui/loading/Loading.svelte";
  import Labeled from "$lib/components/ui/label/Labeled.svelte";
  import SingleSelect from "$lib/components/ui/select/SingleSelect.svelte";
  import { organizations } from "$lib/stores/organizations.store";
  import { session } from "$lib/stores/session";
</script>

{#if $organizations.isPending}
  <Loading loading title="Fetching organizations..." />
{:else if !$organizations.data}
  <p>No organizations found.</p>
{:else if $organizations.data.length === 0}
  <p>You are not a member of any organizations.</p>
{:else if $organizations.data.length === 1}
  {@const org = $organizations.data[0]}

  <p>
    <strong>Organization</strong>: {org.name} ({org.slug})
  </p>
{:else}
  <Labeled label="Switch active organization">
    <SingleSelect
      options={$organizations.data.map((org) => ({
        value: org.id,
        label: `${org.name} (${org.slug})`,
      }))}
      bind:value={
        () => $session.data?.session.activeOrganizationId!,
        (v) => OrganizationsClient.set_active(v)
      }
    />
  </Labeled>
{/if}
