import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { handleSessionRefresh } from './lib/utils/proxy/handleSessionRefresh';
import { roleRoutes } from './constants/roleRoutes';
import { isAllowed } from './lib/utils/proxy/isAllowed';

export async function proxy(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname.startsWith('/login');

  try {
    if (isLoginRoute) {
      const { ok } = await handleSessionRefresh(accessToken, refreshToken);

      if (ok) {
        return NextResponse.redirect(new URL('/', request.nextUrl.origin));
      }

      return NextResponse.next();
    }

    const isProtected = Object.values(roleRoutes)
      .flat()
      .some(route => pathname.startsWith(route));

    if (isProtected) {
      const { ok } = await handleSessionRefresh(accessToken, refreshToken);

      if (!ok) {
        return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
      }

      if (!isAllowed(role, pathname)) {
        return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
      }
    }

    return NextResponse.next();
  } catch {
    console.log('catch proxy');

    return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
  }
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/manager/:path*',
    '/maintenance-worker/:path*',
    '/operator/:path*',
    '/safety/:path*',
    // Cross-role pages already declared per-role in roleRoutes but
    // missing from the matcher — the guard never fired for them and
    // they rendered without a session/role check.
    '/messages/:path*',
    '/reports-and-communications/:path*',
    '/report-fault/:path*',
  ],
};
