import { checkServerSession } from '@/lib/api/serverApi';
import { parse } from 'cookie';

export type RefreshedCookie = {
  name: 'accessToken' | 'refreshToken' | 'sessionId';
  value: string;
  options: {
    expires?: Date;
    path?: string;
    maxAge?: number;
    httpOnly: boolean;
  };
};

export type RefreshResult = {
  ok: boolean;
  refreshed: boolean;
  cookies: RefreshedCookie[];
};

const EMPTY: RefreshResult = { ok: false, refreshed: false, cookies: [] };

export const handleSessionRefresh = async (
  accessToken?: string | undefined,
  refreshToken?: string | undefined
): Promise<RefreshResult> => {
  if (accessToken) return { ok: true, refreshed: false, cookies: [] };

  if (refreshToken) {
    try {
      const data = await checkServerSession();
      const setCookie = data.headers['set-cookie'];

      const cookies: RefreshedCookie[] = [];
      if (setCookie) {
        const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
        for (const cookieStr of cookieArray) {
          const parsed = parse(cookieStr);
          const options = {
            expires: parsed.Expires ? new Date(parsed.Expires) : undefined,
            path: parsed.Path,
            maxAge: Number(parsed['Max-Age']),
            httpOnly: true,
          };
          if (parsed.accessToken)
            cookies.push({
              name: 'accessToken',
              value: parsed.accessToken,
              options,
            });
          if (parsed.refreshToken)
            cookies.push({
              name: 'refreshToken',
              value: parsed.refreshToken,
              options,
            });
          if (parsed.sessionId)
            cookies.push({
              name: 'sessionId',
              value: parsed.sessionId,
              options,
            });
        }
      }
      return { ok: true, refreshed: true, cookies };
    } catch {
      return EMPTY;
    }
  }

  return EMPTY;
};
