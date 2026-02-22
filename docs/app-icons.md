# App Icons

All app icons are derived from the source SVG at `assets/images/icon.svg`.

## Regenerating icons after editing the SVG

Requires `librsvg` (`brew install librsvg`).

```bash
# Main icon (1024x1024)
rsvg-convert -w 1024 -h 1024 assets/images/icon.svg > assets/images/icon.png

# Favicon (48x48)
rsvg-convert -w 48 -h 48 assets/images/icon.svg > assets/images/favicon.png

# Splash icon (200x200)
rsvg-convert -w 200 -h 200 assets/images/icon.svg > assets/images/splash-icon.png
```

## Android adaptive icons

These require separate SVGs for foreground (sun + panels, no background) and monochrome (white silhouette). Create temporary SVGs based on `icon.svg`:

- **Foreground**: Copy the sun and panel elements without the background `<rect>`. Export at 1024x1024.
- **Background**: A solid `#334155` rectangle. Export at 1024x1024.
- **Monochrome**: Same shapes as foreground but all filled white (`#FFFFFF`). Export at 1024x1024.

```bash
rsvg-convert -w 1024 -h 1024 /tmp/android-foreground.svg > assets/images/android-icon-foreground.png
rsvg-convert -w 1024 -h 1024 /tmp/android-background.svg > assets/images/android-icon-background.png
rsvg-convert -w 1024 -h 1024 /tmp/android-monochrome.svg > assets/images/android-icon-monochrome.png
```

The adaptive icon background color in `app.json` (`android.adaptiveIcon.backgroundColor`) should match the SVG background (`#334155`).
