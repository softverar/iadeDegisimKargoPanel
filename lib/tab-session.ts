// Tab ID oluşturma ve yönetme yardımcı fonksiyonları

export function getTabId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  // SessionStorage'dan tab ID'yi al
  let tabId = sessionStorage.getItem("tab-id");

  // Eğer yoksa yeni bir tab ID oluştur
  if (!tabId) {
    tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("tab-id", tabId);
  }

  return tabId;
}

export function getTabRole(): "kurye" | "admin" | null {
  if (typeof window === "undefined") {
    return null;
  }

  const role = sessionStorage.getItem("tab-role");
  return role === "kurye" || role === "admin" ? role : null;
}

export function setTabRole(role: "kurye" | "admin"): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem("tab-role", role);
}

export function clearTabSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem("tab-id");
  sessionStorage.removeItem("tab-role");
}



