import { NextRequest, NextResponse } from 'next/server';
import { logErrorResponse } from '../../_utils/utils';
import { isAxiosError } from 'axios';
import { api } from '../../api';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ userId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const cookie = await cookies();

  const body = await req.json();
  try {
    const { userId } = await params;
    const res = await api.patch(`users/${userId}`, body, {
      headers: {
        Cookie: cookie.toString(),
      },
    });

    return NextResponse.json(res.data);
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
