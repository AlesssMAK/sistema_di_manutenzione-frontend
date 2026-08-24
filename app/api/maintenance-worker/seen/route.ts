import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';
import { logErrorResponse } from '../../_utils/utils';
import { api } from '../../api';

export async function PATCH(req: NextRequest) {
  const cookie = await cookies();
  try {
    const body = await req.json();
    const res = await api.patch('/maintenance-worker/seen', body, {
      headers: { Cookie: cookie.toString() },
    });
    // 204/205/304 must not carry a body — NextResponse.json() always
    // builds one, and the Response constructor rejects a body on those
    // statuses ("Invalid response status code 204"), which would surface
    // as a 500. Forward them bodiless instead.
    if ([204, 205, 304].includes(res.status)) {
      return new NextResponse(null, { status: res.status });
    }
    return NextResponse.json(res.data ?? null, { status: res.status });
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
