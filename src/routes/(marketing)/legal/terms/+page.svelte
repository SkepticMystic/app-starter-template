<script lang="ts">
  import { resolve } from "$app/paths";
  import Alert from "#lib/components/ui/alert/Alert.svelte";
  import { APP } from "#lib/const/app.const.js";
</script>

<!-- A placeholder: replace every section with your own terms, reviewed by
     someone qualified, before launch. -->
<article class="max-w-prose">
  <header class="space-y-2">
    <h1>Terms of service</h1>
    <p class="text-sm text-muted-foreground">Last updated: [date]</p>
  </header>

  <Alert
    icon="lucide/triangle-alert"
    title="Template placeholder"
    description="This page is a starting point, not legal advice. Replace it with terms that fit your product and jurisdiction."
  />

  <section>
    <h2>Using {APP.NAME}</h2>
    <p>
      By creating an account you agree to these terms. You are responsible for
      the activity on your account and for keeping your sign-in methods secure.
    </p>
  </section>

  <section>
    <h2>Your content</h2>
    <p>
      You keep ownership of what you add. You give us the rights we need to
      store and display it in order to provide the service.
    </p>
  </section>

  <section>
    <h2>Acceptable use</h2>
    <p>
      Don't use the service to break the law, harm others, or interfere with its
      operation. We may suspend accounts that do.
    </p>
  </section>

  <section>
    <h2>Billing</h2>
    <p>
      Describe plans, renewals, cancellations and refunds here, if you charge
      for the service.
    </p>
  </section>

  <section>
    <h2>Changes and contact</h2>
    <p>
      We may update these terms and will say so when we do. Questions? <a
        href={resolve("contact")}>Contact us</a
      >.
    </p>
  </section>
</article>
