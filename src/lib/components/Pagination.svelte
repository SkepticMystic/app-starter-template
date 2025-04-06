<script lang="ts">
  import { get_http_error_msg } from "$lib/utils/errors";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { onMount } from "svelte";
  import { toast } from "svelte-daisyui-toast";
  import Loading from "./daisyui/Loading.svelte";

  interface Props {
    data: any[];
    fetchOnMount?: boolean;
    getData: (skip: number, limit: number) => Promise<any[]>;
    total?: number | null;
    pageNo?: number;
    limit?: number;
  }

  let {
    limit = 50,
    pageNo = 1,
    total = null,
    fetchOnMount = true,
    data = $bindable(),
    getData,
  }: Props = $props();

  const loader = Loader<Dir>();

  let skip = $state((pageNo - 1) * limit);
  let page_count = $derived(total ? Math.ceil(total / limit) : null);

  // First | Previous | Current | Next | Last
  type Dir = -2 | -1 | 0 | 1 | 2;

  const getMore = async (dir: Dir = 0) => {
    loader.load(dir);

    if (dir === -2) skip = 0;
    else if (dir === 2) {
      if (!page_count) return;
      else skip = (page_count - 1) * limit;
    } else skip += dir * limit;

    try {
      data = await getData(skip, limit);

      // Set page after completing fetch
      pageNo = Math.floor(skip / limit) + 1;
    } catch (error) {
      toast.error(get_http_error_msg(error));
    }

    loader.reset();
  };

  if (fetchOnMount) onMount(getMore);
</script>

<div>
  <div class="flex">
    <button
      class="btn btn-square btn-secondary rounded-none border-0"
      disabled={any_loading($loader) || skip === 0}
      title="First"
      onclick={async () => await getMore(-2)}
    >
      <Loading loading={$loader[-2]}>≪</Loading>
    </button>
    <button
      class="btn btn-square btn-secondary rounded-none border-0"
      disabled={any_loading($loader) || skip === 0}
      title="Previous"
      onclick={async () => await getMore(-1)}
    >
      <Loading loading={$loader[-1]}>←</Loading>
    </button>

    <button
      class="btn btn-ghost rounded-none border-0 font-bold"
      disabled={any_loading($loader)}
      title="Refresh"
      onclick={async () => await getMore(0)}
    >
      <Loading loading={$loader[0]}>
        {pageNo}{total ? ` / ${page_count}` : ""}
      </Loading>
    </button>

    <button
      class="btn btn-square btn-secondary rounded-none border-0"
      title="Next"
      disabled={any_loading($loader) ||
        (total ? pageNo === page_count : data.length < limit)}
      onclick={async () => await getMore(1)}
    >
      <Loading loading={$loader[1]}>→</Loading>
    </button>
    {#if total}
      <button
        class="btn btn-square btn-secondary rounded-none border-0"
        disabled={any_loading($loader) || pageNo === page_count}
        title="Last"
        onclick={async () => await getMore(2)}
      >
        <Loading loading={$loader[2]}>≫</Loading>
      </button>
    {/if}
    <div class="mx-2"></div>
    <select
      class="select"
      bind:value={limit}
      onchange={async () => {
        skip = 0;
        await getMore();
      }}
    >
      <option value={10}>10</option>
      <option value={20}>20</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
      {#if total}<option value={total}>All</option>{/if}
    </select>
  </div>
</div>
