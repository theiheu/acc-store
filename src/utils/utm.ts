export type Utm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

export function withUtmQuery<T extends Record<string, any>>(
  query: T,
  utm: Utm
): T & Utm {
  return { ...query, ...utm } as T & Utm;
}

export function hrefWithUtm(
  pathname: string,
  query: Record<string, any> = {},
  utm: Utm = {}
): { pathname: string; query: Record<string, any> } {
  return { pathname, query: withUtmQuery(query, utm) };
}
