// Admin credentials - stored securely, never exposed to frontend
const ADMIN_CREDENTIALS = {
  username: "Sampath0411",
  password: "9291493225"
};

export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
