<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import { OrganizationClient } from "$lib/clients/auth/organization.client";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Loading from "$lib/components/ui/loading/Loading.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { session } from "$lib/stores/session.store";

  const organizations = BetterAuthClient.useListOrganizations();
</script>

{#if $organizations.isPending}
  <Loading
    loading
    title="Fetching organizations..."
  />
{:else if !$organizations.data}
  <p>No organizations found.</p>
{:else if $organizations.data.length === 0}
  <p>You are not a member of any organizations.</p>
{:else if $organizations.data.length === 1}
  {@const org = $organizations.data[0]!}

  <p>
    <strong>Organization</strong>: {org.name} ({org.slug})
  </p>
{:else}
  <Field label="Switch active organization">
    {#snippet input({ props })}
      <NativeSelect
        {...props}
        options={$organizations.data!.map((org) => ({
          value: org.id,
          label: `${org.name} (${org.slug})`,
        }))}
        bind:value={
          () => $session.data?.session.activeOrganizationId ?? undefined,
          (v) => OrganizationClient.set_active(v)
        }
      />
    {/snippet}
  </Field>
{/if}
