# App Starter Template

## Features

- SvelteKit, TypeScript
- Tailwind, DaisyUI
- ESLint, Prettier
- Better-Auth
- Drizzle, Redis
- Vercel

## Usage

### Local Development

1. Clone the repository

   ```bash
   git clone https://github.com/SkepticMystic/app-starter-template.git
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   Create a `.env` file in the root directory and add the necessary environment variables. You can refer to the `.env.example` file for guidance.

4. Run the development server

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` to see the app in action.

### Deployment

1. Push your code to a Git repository (e.g., GitHub, GitLab).
2. Connect your repository to Vercel.
3. Set up the environment variables in the Vercel dashboard.
4. Edit the build command to `vite build && npm run db migrate` in the Vercel dashboard.
5. Deploy the app using Vercel.

## TODOs

- [ ] runed.dev
- [ ] PWA on app store: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable#installation_from_an_app_store
- [ ] Add llm.txt n instructions.md, where its helpful
- [ ] Try remove heroicons in favour of lucide
- [ ] Try remove dependence on vercel adapter... try deploy serverful
- [ ] tailwind/forms?
- [ ] nodemailer is _huge_
