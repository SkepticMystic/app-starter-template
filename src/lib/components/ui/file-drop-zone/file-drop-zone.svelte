<script lang="ts">
  import { IMAGE_HOSTING } from "$lib/const/image/image_hosting.const";
  import { cn } from "$lib/utils/shadcn.util";
  import { useId } from "bits-ui";
  import { format_bytes } from ".";
  import Icon from "../icon/Icon.svelte";
  import type { FileDropZoneProps, FileRejectedReason } from "./types";

  let {
    accept,
    children,
    onUpload,
    fileCount,
    id = useId(),
    onFileRejected,
    class: className,
    disabled = false,
    maxFileSize = IMAGE_HOSTING.LIMITS.MAX_FILE_SIZE_BYTES,
    maxFiles = IMAGE_HOSTING.LIMITS.MAX_COUNT.PER_RESOURCE,
    ...rest
  }: FileDropZoneProps = $props();

  if (maxFiles !== undefined && fileCount === undefined) {
    console.warn(
      "Make sure to provide FileDropZone with `fileCount` when using the `maxFiles` prompt",
    );
  }

  let uploading = $state(false);

  const drop = async (
    e: DragEvent & {
      currentTarget: EventTarget & HTMLLabelElement;
    },
  ) => {
    if (disabled || !can_upload) return;

    e.preventDefault();

    const dropped = Array.from(e.dataTransfer?.files ?? []);

    await upload(dropped);
  };

  const change = async (
    e: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    },
  ) => {
    if (disabled) return;

    const selected_files = e.currentTarget.files;
    if (!selected_files) return;

    await upload(Array.from(selected_files));

    // this if a file fails and we upload the same file again we still get feedback
    // (e.target as HTMLInputElement).value = "";
  };

  const should_accept_file = (
    file: File,
    fileNumber: number,
  ): FileRejectedReason | undefined => {
    if (maxFileSize !== undefined && file.size > maxFileSize) {
      return "Maximum file size exceeded";
    } else if (maxFiles !== undefined && fileNumber > maxFiles) {
      return "Maximum files uploaded";
    } else if (!accept) {
      return undefined;
    }

    const accepted_types = accept.split(",").map((a) => a.trim().toLowerCase());
    const file_type = file.type.toLowerCase();
    const file_name = file.name.toLowerCase();

    const is_accepted = accepted_types.some((pattern) => {
      // check extension like .mp4
      if (file_type.startsWith(".")) {
        return file_name.endsWith(pattern);
      }

      // if pattern has wild card like video/*
      if (pattern.endsWith("/*")) {
        const base_type = pattern.slice(0, pattern.indexOf("/*"));
        return file_type.startsWith(base_type + "/");
      }

      // otherwise it must be a specific type like video/mp4
      return file_type === pattern;
    });

    if (!is_accepted) return "File type not allowed";

    return undefined;
  };

  const upload = async (upload_files: File[]) => {
    uploading = true;

    const valid_files: File[] = [];

    for (let i = 0; i < upload_files.length; i++) {
      const file = upload_files[i];
      if (!file) continue;

      const reject_reason = should_accept_file(file, (fileCount ?? 0) + i + 1);

      if (reject_reason) {
        onFileRejected?.({ file, reason: reject_reason });
        continue;
      }

      valid_files.push(file);
    }

    await onUpload(valid_files);

    uploading = false;
  };

  const can_upload = $derived(
    !disabled &&
      !uploading &&
      !(
        maxFiles !== undefined &&
        fileCount !== undefined &&
        fileCount >= maxFiles
      ),
  );
</script>

<label
  for={id}
  ondrop={drop}
  aria-disabled={!can_upload}
  ondragover={(e) => e.preventDefault()}
  class={cn(
    "flex h-48 w-full place-items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-all hover:cursor-pointer hover:bg-accent/25 aria-disabled:opacity-50 aria-disabled:hover:cursor-not-allowed",
    className,
  )}
>
  {#if children}
    {@render children()}
  {:else}
    <div class="flex flex-col place-items-center justify-center gap-2">
      <div
        class="flex size-14 place-items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
      >
        <Icon
          icon="lucide/upload"
          class="size-7"
        />
      </div>

      <div class="flex flex-col gap-0.5 text-center">
        <span class="font-medium text-muted-foreground">
          Drag and drop files here, or click to select files
        </span>
        {#if maxFiles || maxFileSize}
          <span class="text-sm text-muted-foreground/75">
            {#if maxFiles}
              <span>You can upload {maxFiles} files</span>
            {/if}
            {#if maxFiles && maxFileSize}
              <span>(up to {format_bytes(maxFileSize)} each)</span>
            {/if}
            {#if maxFileSize && !maxFiles}
              <span>Maximum size {format_bytes(maxFileSize)}</span>
            {/if}
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <input
    {...rest}
    {id}
    {accept}
    type="file"
    class="hidden"
    onchange={change}
    disabled={!can_upload}
    multiple={maxFiles === undefined || maxFiles - (fileCount ?? 0) > 1}
  />
</label>
