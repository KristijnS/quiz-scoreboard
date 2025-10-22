Usage
-----

This folder contains the source SVG icon and a script to generate platform-ready icons for the Electron build.

Files:
- `icon.svg` - Source vector icon (editable). Replace with your design.
- `generate-icons.sh` - Bash script to generate `icon.png`, `icon.icns` and `icon.ico` from `icon.svg`.

Requirements (optional, for full generation):
- `rsvg-convert` (from librsvg) or `convert` (ImageMagick) to render SVG -> PNG
- On macOS: `iconutil` to produce `.icns`
- `png2ico` or ImageMagick `convert` to produce `.ico`

How to generate icons:

1. Install required tools if not present.
2. Run the script from repo root:

```bash
npm run generate:icons
```

This will place the generated icons into the `electron/` folder. If some tools are missing, the script will skip those steps but will still produce `icon.png` if possible.

Wiring into build:
- The build configuration already references `icon.icns` (macOS) and `icon.ico` (Windows). If those files exist in `electron/`, electron-builder will use them. If not, the default Electron icon will be used.

Notes:
- For best results, provide a square SVG with clear shapes at multiple sizes.
- After generating icons, rebuild the Electron packages:

```bash
npm run build:electron:mac
npm run build:electron:win
```
