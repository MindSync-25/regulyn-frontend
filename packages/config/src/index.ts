export function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is not defined');
  }
  
  return apiBaseUrl;
}
