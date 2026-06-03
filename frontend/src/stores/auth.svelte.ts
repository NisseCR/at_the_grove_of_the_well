import { API_BASE } from "@/lib/config";

const STORAGE_KEY = "auth_token";

function createAuthStore() {
  let token = $state<string | null>(sessionStorage.getItem(STORAGE_KEY));

  return {
    get token() { return token; },
    get isAuthenticated() { return token !== null; },

    async login(password: string): Promise<void> {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error("Incorrect password");
      }

      const { token: newToken } = await response.json();
      token = newToken;
      sessionStorage.setItem(STORAGE_KEY, newToken);
    },

    logout() {
      token = null;
      sessionStorage.removeItem(STORAGE_KEY);
    },
  };
}

export const auth = createAuthStore();
