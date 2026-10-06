# Fyta v8 — polished Cloudflare build

Fyta is a mobile-first nutrition, meal-planning, workout and progress-tracking PWA.

## v8 improvements

- New green fitness/wellness visual system with improved light + dark themes
- Smoother page/sheet transitions and button feedback
- Better mobile navigation, spacing, cards, inputs and focus states
- Loading spinners and clearer success/error status messages
- 30-second AI request timeout instead of hanging indefinitely
- Offline/online feedback while local tracking continues to work
- More durable saved-state migration for older installs
- More reliable iPhone/gallery image loading with a fallback when `createImageBitmap` is unavailable
- Faster barcode path on browsers that support `BarcodeDetector`
- Server-side direct barcode lookup through Open Food Facts
- Additional Gemini model fallbacks
- File-size guard for oversized AI image requests
- Nutrition-result guards and negative-value validation
- Meal planning clamps already-exceeded macros to zero instead of sending negative targets
- Maintain-weight onboarding no longer unnecessarily requires a separate goal weight
- Updated service worker cache so users receive the new build

## Deploy with GitHub + Cloudflare Pages

1. Upload/replace the `Fyta` folder in your GitHub repository.
2. In Cloudflare Pages, connect the repository.
3. Framework preset: **None**.
4. Build command: leave blank.
5. If your repository root contains the `Fyta` folder, set the project root/build output appropriately to `Fyta` (or move the contents of `Fyta` to the repository root).
6. Add the secret `GEMINI_API_KEY` in **Settings → Variables and Secrets**.
7. Redeploy.

The Cloudflare Pages Function is located at `functions/api/gemini.js` and is called by the app at `/api/gemini`.

## Notes

Exercise demo MP4 files can be placed in `assets/exercises/`. When a clip is missing, Fyta uses its built-in animated fallback.

AI nutrition values are estimates and should be reviewed before logging.
