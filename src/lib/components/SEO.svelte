<script lang="ts">
  import { page } from "$app/state";
  import { APP } from "$lib/const/app";

  let title = $derived(
    page.data.seo?.title ? page.data.seo.title + ` | ${APP.NAME}` : APP.NAME,
  );

  let desc = $derived(page.data.seo?.desc ?? APP.DESCRIPTION);
</script>

<title>
  {title}
</title>

<meta property="title" content={title} />
<meta property="og:title" content={title} />
<meta property="twitter:title" content={title} />

<meta property="og:url" content={page.url.href} />
<meta property="og:site_name" content={APP.NAME} />

<meta property="description" content={desc} />
<meta property="og:description" content={desc} />
<meta property="twitter:description" content={desc} />

<meta property="og:image" content={page.data.seo?.image_url ?? APP.LOGO_URL} />
