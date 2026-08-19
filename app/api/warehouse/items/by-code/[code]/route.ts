import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { api } from '../../../../api';
import { logErrorResponse } from '../../../../_utils/utils';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ code: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const cookie = await cookies();
  try {
    const { code } = await params;
    const res = await api.get(
      `warehouse/items/by-code/${encodeURIComponent(code)}`,
      {
        headers: { Cookie: cookie.toString() },
      }
    );
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
