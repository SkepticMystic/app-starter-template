<script>
  import { Strings } from "$lib/utils/strings.util";
</script>

<select class="select-bordered select" data-choose-theme>
  {#each ["acid", "autumn", "black", "bumblebee", "business", "cmyk", "coffee", "corporate", "cupcake", "cyberpunk", "dracula", "emerald", "fantasy", "forest", "garden", "halloween", "lemonade", "light", "lofi", "luxury", "night", "pastel", "retro", "valentine", "winter"] as theme (theme)}
    <option value={theme}>
      {Strings.capitalize(theme)}
    </option>
  {/each}
</select>
