<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import FieldError from "$lib/components/ui/field/field-error.svelte";
  import { format_bytes } from "$lib/components/ui/file-drop-zone";
  import FileDropZone from "$lib/components/ui/file-drop-zone/file-drop-zone.svelte";
  import type { FileDropZoneProps } from "$lib/components/ui/file-drop-zone/types";
  import Item from "$lib/components/ui/item/Item.svelte";
  import ItemList from "$lib/components/ui/item/ItemList.svelte";
  import type { RESOURCE } from "$lib/const/resource/resource.const";
  import { upload_images_remote } from "$lib/remote/image/image.remote";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import { onDestroy } from "svelte";
  import { toast } from "svelte-sonner";
  import { SvelteMap } from "svelte/reactivity";
  import FormButton from "../FormButton.svelte";

  let {
    resource_id,
    resource_kind,
    after_upload,
  }: {
    resource_id: string;
    resource_kind: (typeof RESOURCE.KINDS)[number];
    after_upload?: (results: NonNullable<typeof form.result>) => void;
  } = $props();

  let urls = new SvelteMap<string, string>();
  const revoke_urls = () => {
    urls.forEach((url, name) => {
      urls.delete(name);
      URL.revokeObjectURL(url);
    });
  };

  const form = upload_images_remote;

  FormUtil.init(form, () => ({
    resource_id,
    resource_kind,
    files: [],
  }));

  const on_upload: FileDropZoneProps["onUpload"] = async (files) => {
    revoke_urls();

    for (const file of files) {
      urls.set(file.name, URL.createObjectURL(file));
    }

    form.fields.files.set(files);
  };

  const on_file_rejected: FileDropZoneProps["onFileRejected"] = async ({
    reason,
    file,
  }) => {
    toast.error(`${file.name} failed to upload`, { description: reason });
  };

  onDestroy(() => {
    revoke_urls();
  });
</script>

<form
  {...form.enhance(async (e) => {
    await e.submit();

    const res = form.result;
    FormUtil.count_issue_metrics(form, "image_upload");

    if (res?.ok) {
      after_upload?.(res);

      if (res.data.every((r) => r.ok)) {
        form.fields.files.set([]);

        toast.success("Images uploaded successfully");
      } else {
        for (const r of res.data) {
          if (r.ok === false) {
            toast.error(r.error.message);
          }
        }
      }
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
  enctype="multipart/form-data"
  class="flex w-full flex-col gap-2 p-6"
>
  <input {...form.fields.resource_id.as("hidden", resource_id)} />
  <input {...form.fields.resource_kind.as("hidden", resource_kind)} />

  <FileDropZone
    onUpload={on_upload}
    onFileRejected={on_file_rejected}
    accept="image/*"
    fileCount={form.fields.files.value()?.length ?? 0}
    {...form.fields.files.as("file multiple")}
  />

  <ItemList
    empty={{
      icon: "lucide/image",
      title: "No images added",
      description: "Drag and drop images above to add them to the upload list.",
    }}
    items={form.fields.files
      .value()
      ?.flatMap((f) => (f ? [{ id: f.name, file: f }] : [])) ?? []}
  >
    {#snippet item(item, i)}
      {@const url = urls.get(item.file.name)}

      <Item
        size="sm"
        title={item.file.name}
        description={format_bytes(item.file.size)}
      >
        {#snippet media()}
          <img
            src={url}
            alt={item.file.name}
            width={100}
            height={100}
            class="object-cover"
          />
        {/snippet}

        {#snippet actions()}
          <Button
            icon="lucide/x"
            variant="outline"
            disabled={form.pending > 0}
            onclick={() => {
              if (url) {
                urls.delete(item.file.name);
                URL.revokeObjectURL(url);
              }

              const files = form.fields.files.value();
              form.fields.files.set(files.filter((_, idx) => idx !== i));
            }}
          />
        {/snippet}
      </Item>
    {/snippet}
  </ItemList>

  <FormButton
    {form}
    class="w-fit"
    icon="lucide/upload"
    disabled={!form.fields.files.value()?.length}
  >
    Upload images
  </FormButton>

  <FieldError errors={form.fields.allIssues()} />
</form>
