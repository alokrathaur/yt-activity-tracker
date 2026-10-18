# YT Activity Tracker website

A static site for GitHub Pages, with no build step.

| File | What it is |
|---|---|
| `index.html` | Home: features, Free vs Full Access, unlock steps, privacy, FAQ |
| `guide.html` | Setup guide with screenshots: install, Play Protect, Usage Access, Media Playback Access, Accessibility, notifications, battery, Full Access |
| `terms.html`, `privacy.html`, `refund.html` | Terms of Service, Privacy Policy and Refund & Cancellation Policy (Dodo's verification requires all three, plus a contact route) |
| `assets/config.js` | **Set these two:** `licenseApiUrl` (the worker) and `contactEmail` (shown on every page) |
| `assets/pricing.js` | Shows INR prices in India and USD prices everywhere else, using the worker's `/pricing` or else a time-zone guess, and starts checkout |
| `success.html` | Dodo Payments redirect page after checkout. It opens the app with `yttracker://premium` |
| `downloads/YT-Activity-Tracker.apk` | The APK the Download buttons link to |
| `assets/` | Stylesheet, icon, screenshots (`screens/*.webp`) |

## Publish on GitHub Pages

1. Push this folder's contents to a GitHub repo, for example `yt-activity-tracker`.
2. Go to repo **Settings → Pages → Build and deployment**, choose *Deploy from a branch*, select `main` and `/ (root)`.
3. The site goes live at `https://<username>.github.io/<repo>/`.
4. Set `CHECKOUT_RETURN_URL` in `cloudflare-worker/wrangler.toml` to `https://<username>.github.io/<repo>/success.html` and redeploy the worker.

## Updating the APK

Build a signed release and replace the file, keeping the same name so every link keeps working:

```bash
./gradlew assembleRelease
cp app/build/outputs/apk/release/app-release.apk WebSite/downloads/YT-Activity-Tracker.apk
```

GitHub rejects files over 100 MB; the APK is about 20 MB.
