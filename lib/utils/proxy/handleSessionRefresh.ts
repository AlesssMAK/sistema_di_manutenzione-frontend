import { checkServerSession } from '@/lib/api/serverApi';
import { parse } from 'cookie';
import { cookies } from 'next/headers';

export const handleSessionRefresh = async (
  accessToken?: string | undefined,
  refreshToken?: string | undefined
): Promise<{ ok: boolean; refreshed: boolean }> => {
  const cookieStore = await cookies();

  if (accessToken) {
    return { ok: true, refreshed: false };
  }

  if (!accessToken) {
    if (refreshToken) {
      const data = await checkServerSession();
      const setCookie = data.headers['set-cookie'];

      if (setCookie) {
        const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
        for (const cookieStr of cookieArray) {
          const parsed = parse(cookieStr);
          const options = {
            expires: parsed.Expires ? new Date(parsed.Expires) : undefined,
            path: parsed.Path,
            maxAge: Number(parsed['Max-Age']),
          };
          if (parsed.accessToken)
            cookieStore.set('accessToken', parsed.accessToken, options);
          if (parsed.refreshToken)
            cookieStore.set('refreshToken', parsed.refreshToken, options);
        }

        return { ok: true, refreshed: true };
      }
    }
    return { ok: false, refreshed: false };
  }
  return { ok: false, refreshed: false };
};
