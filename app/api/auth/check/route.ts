import { NextResponse } from 'next/server';
import { logErrorResponse } from '../../_utils/utils';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';
import { parse } from 'cookie';
import { api } from '../../api';

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  // Validate the access token against the backend rather than trusting
  // its presence — a stale cookie (e.g. session killed by a login
  // elsewhere) must not read as "authenticated". On 401 we fall through
  // to the refresh path below.
  if (accessToken) {
    try {
      await api.get('users/me', { headers: { Cookie: cookieStore.toString() } });
      return NextResponse.json({ authenticated: true });
    } catch {
      // Access token no longer valid — try to refresh below.
    }
  }

  // No refresh token either → genuinely signed out.
  if (!refreshToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    // Cookie goes in the axios config (3rd arg) — passing it as the
    // 2nd argument sent it as the request body, so the backend never
    // saw it and always replied 401.
    const refreshRes = await api.post('/auth/refresh', null, {
      headers: { Cookie: cookieStore.toString() },
    });

    // Route handlers (unlike middleware) CAN write cookies — propagate
    // the rotated tokens so the next request carries the fresh ones.
    const setCookie = refreshRes.headers['set-cookie'];
    if (setCookie) {
      const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
      for (const cookieStr of arr) {
        const parsed = parse(cookieStr);
        const options = {
          expires: parsed.Expires ? new Date(parsed.Expires) : undefined,
          path: parsed.Path,
          maxAge: Number(parsed['Max-Age']),
          httpOnly: true,
        };
        if (parsed.accessToken)
          cookieStore.set('accessToken', parsed.accessToken, options);
        if (parsed.refreshToken)
          cookieStore.set('refreshToken', parsed.refreshToken, options);
        if (parsed.sessionId)
          cookieStore.set('sessionId', parsed.sessionId, options);
      }
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    if (isAxiosError(error)) {
      logErrorResponse(error.response?.data);
      return NextResponse.json(
        { authenticated: false },
        { status: error.response?.status || 401 }
      );
    }
    logErrorResponse({ message: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
