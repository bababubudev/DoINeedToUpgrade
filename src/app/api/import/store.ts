interface StoredSpecs {
  specs: Record<string, unknown>;
  createdAt: number;
}

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

const store = new Map<string, StoredSpecs>();

function cleanup() {
  const now = Date.now();
  for (const [key, value] of store) {
    if (now - value.createdAt > TOKEN_TTL_MS) {
      store.delete(key);
    }
  }
}

export function storeSpecs(specs: Record<string, unknown>): string {
  cleanup();
  const token = crypto.randomUUID();
  store.set(token, { specs, createdAt: Date.now() });
  return token;
}

export function retrieveSpecs(token: string): Record<string, unknown> | null {
  cleanup();
  const entry = store.get(token);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TOKEN_TTL_MS) {
    store.delete(token);
    return null;
  }
  store.delete(token); // single-use
  return entry.specs;
}
