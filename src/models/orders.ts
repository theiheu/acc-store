// Shared order-related models

export type AccountCredential = {
  username?: string;
  password?: string;
  token?: string;
  raw: string;
  extra?: Record<string, string>;
};

