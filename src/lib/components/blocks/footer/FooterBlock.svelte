<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import Anchor from "$lib/components/ui/anchor/Anchor.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Logo from "$lib/components/ui/image/Logo.svelte";
  import { APP } from "$lib/const/app.const";

  type FooterSection = {
    title: string;
    links: {
      label: string;
      icon?: string;
      external?: boolean;
      href: ResolvedPathname;
    }[];
  };

  const sections: FooterSection[] = $derived([
    {
      title: "Pages",
      links: [{ label: "Tasks", href: "/tasks" }],
    },
    {
      title: "About",
      links: [
        // TODO
        // { label: "Our Mission", href: "/about" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
    // {
    //   title: "Legal",
    //   links: [
    //     // TODO
    //     { label: "Privacy Policy", href: "/legal/privacy" },
    //     { label: "Terms of Service", href: "/legal/terms" },
    //   ],
    // },
  ]);

  const currentYear = new Date().getFullYear();
</script>

<footer class="border-t bg-background">
  <div class="mx-auto max-w-4xl px-2 py-6 sm:px-3 md:px-5">
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Brand Section -->
      <div class="lg:col-span-1">
        <a href="/">
          <div class="flex items-center gap-2">
            <Logo />
            <h3>{APP.NAME}</h3>
          </div>
        </a>

        <p class="mt-2 text-sm text-muted-foreground">
          {APP.DESCRIPTION}
        </p>
      </div>

      <!-- Link Sections -->
      {#each sections as section (section.title)}
        <div>
          <h4>{section.title}</h4>

          <nav class="mt-4 flex flex-col gap-y-2">
            {#each section.links as link (link.href)}
              <Anchor
                icon={link.icon}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                class="text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
              >
                {link.label}

                {#if link.external}
                  <Icon
                    icon="lucide/external-link"
                    class="size-3"
                  />
                {/if}
              </Anchor>
            {/each}
          </nav>
        </div>
      {/each}
    </div>

    <!-- Copyright -->
    <div class="mt-6 border-t pt-4">
      <p
        class="flex items-center justify-center gap-1 text-sm text-muted-foreground"
      >
        © {currentYear}
        {APP.NAME}. Made with
        <Icon
          icon="lucide/heart"
          class="inline-block size-4"
        />
        <!-- for {#each ANIMALS.SPECIES.IDS as species_id (species_id)}
          {@const { icon } = ANIMALS.SPECIES.MAP[species_id]}
          <Icon
            {icon}
            class="inline-block size-4"
          />
        {/each} -->
      </p>
    </div>
  </div>
</footer>
