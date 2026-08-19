import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { api } from '../../../api';
import { logErrorResponse } from '../../../_utils/utils';
import { cookies } from 'next/headers';

interface Props {
  params: Promise<{ itemId: string }>;
}

export async function PUT(req: NextRequest, { params }: Props) {
  const cookie = await cookies();
  const body = await req.json();
  try {
    const { itemId } = await params;
    const res = await api.put(`warehouse/items/${itemId}`, body, {
      headers: { Cookie: cookie.toString() },
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
  const cookie = await cookies();
  try {
    const { itemId } = await params;
    const res = await api.delete(`warehouse/items/${itemId}`, {
      headers: { Cookie: cookie.toString() },
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
