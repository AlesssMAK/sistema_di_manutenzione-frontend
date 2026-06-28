import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  handleSessionRefresh,
  type RefreshedCookie,
} from './lib/utils/proxy/handleSessionRefresh';
import { roleRoutes } from './constants/roleRoutes';
import { isAllowed } from './lib/utils/proxy/isAllowed';

const applyCookies = (response: NextResponse, cookies: RefreshedCookie[]) => {
  for (const { name, value, options } of cookies) {
    response.cookies.set(name, value, options);
  }
  return response;
};

export async function proxy(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname.startsWith('/login');

  try {
    if (isLoginRoute) {
      const { ok, cookies } = await handleSessionRefresh(
        accessToken,
        refreshToken
      );

      if (ok) {
        return applyCookies(
          NextResponse.redirect(new URL('/', request.nextUrl.origin)),
          cookies
        );
      }

      return NextResponse.next();
    }
    const { ok, cookies } = await handleSessionRefresh(
      accessToken,
      refreshToken
    );

    if (pathname === '/') {
      const home = ok && role ? roleRoutes[role]?.[0] : undefined;
      if (home) {
        return applyCookies(
          NextResponse.redirect(new URL(home, request.nextUrl.origin)),
          cookies
        );
      }
      return applyCookies(NextResponse.next(), cookies);
    }

    if (!ok) {
      return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
    }

    const isRoleScoped = Object.values(roleRoutes)
      .flat()
      .some(route => pathname.startsWith(route));

    if (isRoleScoped && !isAllowed(role, pathname)) {
      return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
    }

    return applyCookies(NextResponse.next(), cookies);
  } catch {
    return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/manager/:path*',
    '/maintenance-worker/:path*',
    '/operator/:path*',
    '/safety/:path*',
    '/messages/:path*',
    '/reports-and-communications/:path*',
    '/report-fault/:path*',
  ],
};
