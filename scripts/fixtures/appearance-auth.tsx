const data = { user: { id: "appearance-host", email: "appearance-host@test.com" } };
export function useSession() {
  return { status: "authenticated", data, update: async () => {} };
}
export default function AuthModal() { return null; }
