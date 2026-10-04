<script lang="ts">
  import { page } from "$app/state";
  import { OrganizationClient } from "#lib/clients/auth/organization.client.js";
  import Field from "#lib/components/ui/field/Field.svelte";
  import NativeSelect from "#lib/components/ui/native-select/native-select.svelte";
  import Spinner from "#lib/components/ui/spinner/spinner.svelte";
  import { list_organizations_remote } from "#lib/remote/auth/organization/organization.remote.js";
  import { Toast } from "#lib/utils/toast.util.js";

  const organizations = list_organizations_remote();

  const orgs = $derived(
    organizations.current?.ok ? organizations.current.data : null,
  );

  const set_active = async (org_id: string | undefined) => {
    if (!org_id) return;

    const res = await OrganizationClient.set_active(org_id);
    if (!res.ok) Toast.err(res.error);
  };
</script>

{#if organizations.loading}
  <Spinner aria-label="Fetching organizations" />
{:else if !orgs}
  <p>No organizations found.</p>
{:else if orgs.length === 0}
  <p>You are not a member of any organizations.</p>
{:else if orgs.length === 1}
  {@const org = orgs[0]!}

  <p>
    <strong>Organization</strong>: {org.name} ({org.slug})
  </p>
{:else}
  <Field label="Switch active organization">
    {#snippet input({ props })}
      <NativeSelect
        {...props}
        options={orgs.map((org) => ({
          value: org.id,
          label: `${org.name} (${org.slug})`,
        }))}
        bind:value={() => page.data.org?.id, set_active}
      />
    {/snippet}
  </Field>
{/if}
