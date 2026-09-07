import { NextResponse } from 'next/server';
import { logErrorResponse } from '../../../_utils/utils';
import { isAxiosError } from 'axios';
import { api } from '../../../api';
import { cookies } from 'next/headers';

// Persist the user's chosen UI language onto their profile, so localized
// emails go out in the language they actually use.
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();

    const res = await api.patch('users/me/locale', body, {
      headers: {
        Cookie: cookieStore.toString(),
      },
    });
    return NextResponse.json(res.data, { status: res.status });
  } catch (error) {
    if (isAxiosError(error)) {
      logErrorResponse(error.response?.data);
      return NextResponse.json(
        { error: error.response?.data },
        { status: error.response?.status || 500 }
      );
    }
    logErrorResponse({ message: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
