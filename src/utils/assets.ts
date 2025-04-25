// Utility function to get the correct asset path based on the environment
export function getAssetPath(filePath: string): string {
  const base = import.meta.env.BASE_URL;
  const cleaned = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  return `${base}${cleaned}`;
}