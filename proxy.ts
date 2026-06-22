import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  handleSessionRefresh,
  type RefreshedCookie,
} from './lib/utils/proxy/handleSessionRefresh';
import { roleRoutes } from './constants/roleRoutes';
import { isAllowed } from './lib/utils/proxy/isAllowed';

// cookies() from next/headers is read-only inside middleware — any
// .set() there is dropped. Refreshed tokens have to land on the
// NextResponse the middleware returns so the browser persists them.
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

    // Everything the matcher covers except /login is private — a
    // valid session is required. The role selector at "/" is private
    // too but isn't tied to a single role, so the role check below
    // only fires for role-scoped sections.
    const { ok, cookies } = await handleSessionRefresh(
      accessToken,
      refreshToken
    );

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
    // Public-but-session-aware (redirects to / when already signed in).
    '/login',
    // Role selector / landing — private, any signed-in role.
    '/',
    // Role-scoped sections.
    '/admin/:path*',
    '/manager/:path*',
    '/maintenance-worker/:path*',
    '/operator/:path*',
    '/safety/:path*',
    // Cross-role private sections.
    '/messages/:path*',
    '/reports-and-communications/:path*',
    '/report-fault/:path*',
  ],
};
