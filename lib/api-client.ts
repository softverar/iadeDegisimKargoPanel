// API istekleri için yardımcı fonksiyonlar - Tab ID'yi otomatik ekler

export function getApiHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }

  const tabId = sessionStorage.getItem("tab-id");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  
  if (tabId) {
    headers["x-tab-id"] = tabId;
  }

  return headers;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getApiHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}




