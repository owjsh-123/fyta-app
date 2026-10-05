# Fyta — Cloudflare-ready project

This is the complete Fyta app converted from Netlify to Cloudflare Pages Functions.

## Deploy with GitHub + Cloudflare Pages
1. Unzip this package.
2. Upload the **contents inside the `Fyta` folder** to a GitHub repository, for example `fyta-app`.
3. In Cloudflare, go to **Workers & Pages → Create application → Pages → Connect to Git**.
4. Choose your `fyta-app` repository.
5. Framework preset: **None**.
6. Build command: leave blank.
7. Build output directory: `.`
8. Deploy.
9. In the Cloudflare project, open **Settings → Variables and Secrets**.
10. Add a secret named `GEMINI_API_KEY` with your Gemini API key.
11. Redeploy after adding the secret.

## What is included
- Today dashboard
- Food-photo scanner with food-only guard
- Camera-roll upload
- Barcode scanner
- Nutrition-label scanner
- AI meal planning
- Tailored meal generation
- Fix My Day coach
- Gym tracking
- Exercise library
- Real-person exercise video support
- Progress and settings
- Fyta home-screen name and premium logo
- PWA/service worker
- Cloudflare Pages Function at `/api/gemini`

## Exercise videos
Owned/licensed MP4 demos go in `assets/exercises/`. If a clip is missing, the app uses its animated fallback.
