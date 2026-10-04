import { APP } from "#lib/const/app.const.js";
import type { RequestHandler } from "./$types";

export const prerender = true;

// A route rather than `static/robots.txt`, so the `Sitemap:` line can name the
// real origin. Keep `Disallow` in step with the sitemap's exclusions.
const ROBOTS = `User-agent: *
Allow: /

# Auth (keep signin/signup crawlable)
Disallow: /auth/verify-email
Disallow: /auth/reset-password
Disallow: /auth/forgot-password
Disallow: /auth/two-factor
Disallow: /auth/account-deleted
Disallow: /auth/organization

# Signed-in pages
Disallow: /home
Disallow: /tasks
Disallow: /settings
Disallow: /admin
Disallow: /onboarding

# Dev-only tools, 404 in a built app
Disallow: /dev

# Training-only crawlers are blocked. Search crawlers (OAI-SearchBot,
# Claude-SearchBot, PerplexityBot) are allowed, so the site can appear in AI
# search results. GPTBot, ClaudeBot and Google-Extended collect training data:
# add them here to opt out of that too.
User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: meta-externalagent
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

Sitemap: ${APP.URL}/sitemap.xml
`;

export const GET: RequestHandler = () =>
  new Response(ROBOTS, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
