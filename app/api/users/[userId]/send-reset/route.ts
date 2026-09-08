import { NextRequest, NextResponse } from 'next/server';
import { logErrorResponse } from '../../../_utils/utils';
import { isAxiosError } from 'axios';
import { api } from '../../../api';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ userId: string }>;
}

// Admin re-sends a set-password / activation link to an existing user.
export async function POST(_req: NextRequest, { params }: Props) {
  const cookie = await cookies();
  try {
    const { userId } = await params;
    const res = await api.post(
      `users/${userId}/send-reset`,
      {},
      {
        headers: {
          Cookie: cookie.toString(),
        },
      }
    );
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
