/** Resolve local public assets under the deployment path, preserving external URLs. */
export function assetUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return `${import.meta.env.BASE_URL}${path.slice(1)}`;
}
