<script lang="ts">
  import { resolve } from "$app/paths";
  import Alert from "#lib/components/ui/alert/Alert.svelte";
  import { APP } from "#lib/const/app.const.js";
</script>

<!-- A placeholder: replace every section with your own policy, reviewed by
     someone qualified, before launch. -->
<article class="max-w-prose">
  <header class="space-y-2">
    <h1>Privacy policy</h1>
    <p class="text-sm text-muted-foreground">Last updated: [date]</p>
  </header>

  <Alert
    icon="lucide/triangle-alert"
    title="Template placeholder"
    description="This page is a starting point, not legal advice. Replace it with a policy that fits your product and jurisdiction."
  />

  <section>
    <h2>What we collect</h2>
    <p>
      When you create an account with {APP.NAME}, we store your name, email
      address and, if you choose them, a password hash, passkeys and linked
      sign-in providers. We also keep the content you add, such as tasks and
      images, and basic request data (IP address, browser) to secure the
      service.
    </p>
  </section>

  <section>
    <h2>How we use it</h2>
    <p>
      To provide and secure the service, to send account emails such as
      verification and password resets, and to understand errors so we can fix
      them.
    </p>
  </section>

  <section>
    <h2>Who we share it with</h2>
    <p>
      Service providers that run parts of {APP.NAME} on our behalf, such as hosting,
      email delivery, error monitoring and payments. List each one here, with what
      it receives.
    </p>
  </section>

  <section>
    <h2>Your choices</h2>
    <p>
      You can update your profile or delete your account at any time from
      account settings. Deleting your account permanently removes your data.
    </p>
  </section>

  <section>
    <h2>Contact</h2>
    <p>
      Questions about this policy? <a href={resolve("contact")}>Contact us</a>.
    </p>
  </section>
</article>
