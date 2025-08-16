export type Credential = {
  user?: string;
  pass?: string;
  email?: string;
};

const USER_KEYS = ["user", "username", "account", "tài khoản", "login", "tk"];
const PASS_KEYS = ["pass", "password", "mật khẩu", "mk"];
const EMAIL_KEYS = ["email", "mail", "email_address", "mail_address"];

function isNonEmpty(s?: string): s is string {
  return !!s && s.trim().length > 0;
}

function splitParts(input: string): string[] {
  return input
    .split(/[|;,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractKV(part: string): { key: string; value: string } | null {
  const segs = part.split(/[:=]/, 2);
  if (segs.length < 2) return null;
  const key = segs[0]?.trim().toLowerCase();
  const value = segs[1]?.trim();
  if (!isNonEmpty(key) || !isNonEmpty(value)) return null;
  return { key, value };
}

function mapKey(key: string): "user" | "pass" | "email" | null {
  if (USER_KEYS.some((k) => key.includes(k))) return "user";
  if (PASS_KEYS.some((k) => key.includes(k))) return "pass";
  if (EMAIL_KEYS.some((k) => key.includes(k))) return "email";
  return null;
}

function parseLine(line: string): Credential | null {
  const parts = splitParts(line);
  if (parts.length === 0) return null;

  // Try labeled parts first
  const labeled: Partial<Credential> = {};
  let anyLabeled = false;
  for (const part of parts) {
    const kv = extractKV(part);
    if (!kv) continue;
    const kind = mapKey(kv.key);
    if (!kind) continue;
    anyLabeled = true;
    if (!labeled[kind]) labeled[kind] = kv.value;
  }
  if (anyLabeled && (labeled.user || labeled.pass || labeled.email)) {
    return labeled as Credential;
  }

  // Position-based fallback: user|pass|email
  const [pUser, pPass, pEmail] = parts;
  const cred: Credential = {};
  if (isNonEmpty(pUser)) cred.user = pUser;
  if (isNonEmpty(pPass)) cred.pass = pPass;
  if (isNonEmpty(pEmail)) cred.email = pEmail;
  if (cred.user || cred.pass || cred.email) return cred;
  return null;
}

function parseObject(obj: Record<string, any>): Credential[] {
  // Direct fields
  const findVal = (keys: string[]) => {
    for (const k of Object.keys(obj)) {
      const kk = k.toLowerCase();
      if (keys.some((x) => kk.includes(x))) {
        const v = obj[k];
        if (typeof v === "string" && isNonEmpty(v)) return v;
      }
    }
    return undefined;
  };
  const user = findVal(USER_KEYS);
  const pass = findVal(PASS_KEYS);
  const email = findVal(EMAIL_KEYS);
  if (user || pass || email) return [{ user, pass, email }];

  // Common container fields
  const data = obj.data;
  if (Array.isArray(data)) return data.flatMap(parseCredentials);

  // If object has many string fields, try join and parse
  const strValues = Object.values(obj).filter(
    (v) => typeof v === "string"
  ) as string[];
  if (strValues.length) {
    // Prefer single combined string if present
    const combined = strValues.join("|");
    const c = parseLine(combined);
    if (c) return [c];
    return strValues.map((s) => parseLine(s)).filter(Boolean) as Credential[];
  }

  return [];
}

function hasAny(c: Credential | null | undefined): boolean {
  return (
    !!c && (isNonEmpty(c.user) || isNonEmpty(c.pass) || isNonEmpty(c.email))
  );
}

function mergeCredentialsList(list: Credential[]): Credential[] {
  const result: Credential[] = [];
  let cur: Credential = {};
  for (const p of list) {
    if (!p) continue;
    const conflictUser =
      isNonEmpty(cur.user) && isNonEmpty(p.user) && cur.user !== p.user;
    const conflictPass =
      isNonEmpty(cur.pass) && isNonEmpty(p.pass) && cur.pass !== p.pass;
    const conflictEmail =
      isNonEmpty(cur.email) && isNonEmpty(p.email) && cur.email !== p.email;
    const startsNew =
      conflictUser ||
      conflictPass ||
      conflictEmail ||
      (isNonEmpty(p.user) && hasAny(cur));
    if (startsNew && hasAny(cur)) {
      result.push(cur);
      cur = {};
    }
    cur = {
      user: cur.user ?? p.user,
      pass: cur.pass ?? p.pass,
      email: cur.email ?? p.email,
    };
  }
  if (hasAny(cur)) result.push(cur);
  return result;
}

export function parseCredentials(input: unknown): Credential[] {
  try {
    if (input == null) return [];
    if (typeof input === "string") {
      const c = parseLine(input);
      return c ? [c] : [];
    }
    if (Array.isArray(input)) {
      const flat = input.flatMap(parseCredentials);
      return mergeCredentialsList(flat);
    }
    if (typeof input === "object") {
      const list = parseObject(input as Record<string, any>);
      return mergeCredentialsList(list);
    }
    return [];
  } catch {
    return [];
  }
}
