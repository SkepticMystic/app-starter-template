<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Labeled from "$lib/components/ui/label/Labeled.svelte";
  import SingleSelect from "$lib/components/ui/select/SingleSelect.svelte";
  import { organizations } from "$lib/stores/organizations.store";
  import { session } from "$lib/stores/session";
  import { Loader } from "$lib/utils/loader";

  let loader = Loader<"set_active">();

  const set_active = async (organizationId?: string) => {
    if (!organizationId) return;
    loader.load("set_active");

    const res = await OrganizationsClient.set_active(organizationId);
    if (res.ok) {
      location.reload();
    }

    loader.reset();
  };
</script>

{#if $organizations.isPending}
  <Loading loading></Loading>
{:else if !$organizations.data}
  <p>No organizations found.</p>
{:else if $organizations.data.length === 0}
  <p>You are not a member of any organizations.</p>
{:else if $organizations.data.length === 1}
  <p>
    <strong>Organization</strong>: {$organizations.data[0].name} ({$organizations
      .data[0].slug})
  </p>
{:else}
  <Labeled label="Select Organization">
    <SingleSelect
      disabled={$loader["set_active"]}
      value={$session.data?.session.activeOrganizationId ?? undefined}
      options={$organizations.data.map((org) => ({
        value: org.id,
        label: `${org.name} (${org.slug})`,
      }))}
      on_value_select={set_active}
    />
  </Labeled>
{/if}
