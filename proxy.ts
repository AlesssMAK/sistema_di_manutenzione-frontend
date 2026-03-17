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

  try {
    const isProtected = Object.values(roleRoutes)
      .flat()
      .some(route => pathname.startsWith(route));

    if (isProtected) {
      const { ok } = await handleSessionRefresh(accessToken, refreshToken);

      // розкомітити після написання всього коду

      // if (!ok) {
      //   return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
      // }

      // if (!isAllowed(role, pathname)) {
      //   return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
      // }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.nextUrl.origin));
  }
}

export const config = {
  matcher: [
    // '/admin/:path*',
    // '/manager/:path*',
    // '/maintenance-worker/:path*',    <----  // розкомітити після написання всього коду
    // '/operator/:path*',
    // '/safety/:path*',
  ],
};
