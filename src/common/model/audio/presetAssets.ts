/**
 * presetAssets.ts
 *
 * Resolves bundled preset filenames to Vite asset URLs. Uses import.meta.glob so
 * new clips only need a file in src/assets/audio/ plus an entry in presetCatalog.ts.
 */
const presetAssetUrls = import.meta.glob("../../../assets/audio/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** URL for a bundled clip in src/assets/audio/, or undefined if not present. */
export function getPresetAssetUrl(filename: string): string | undefined {
  const suffix = `/${filename}`;
  const key = Object.keys(presetAssetUrls).find((path) => path.endsWith(suffix));
  return key ? presetAssetUrls[key] : undefined;
}
