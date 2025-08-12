export type UserRole = "user" | "admin";

export type UserStatus = "active" | "suspended" | "banned";

export type User = {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  status: UserStatus;
  balance: number; // User's account balance in VND
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
};

const STORAGE_KEY = "accstore:user";

export function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(STORAGE_KEY);
}
