import { read_session } from "#lib/server/services/auth.service.js";
import { App } from "#lib/utils/app.js";
import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import { raise } from "#lib/utils/result.util.js";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await read_session();
  if (!session.ok) raise(session.error);

  if (!session.data) {
    redirect(302, App.url("/auth/signup"));
  }
  // `org_id`, not `activeOrganizationId`: `read_session` clears it when the
  // membership is gone, so a removed member lands here rather than looping.
  else if (session.data.session.org_id) {
    redirect(302, App.url("/home"));
  }

  return {
    seo: {
      ...SEOUtil.transform({ title: "Create your organization" }),
      robots: "noindex,nofollow",
    },
  };
}) satisfies PageServerLoad;
