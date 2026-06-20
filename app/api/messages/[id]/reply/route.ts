import { NextRequest, NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { cookies } from 'next/headers';
import { logErrorResponse } from '../../../_utils/utils';
import { api } from '../../../api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookie = await cookies();
  const { id } = await params;

  try {
    // ReplyForm with image attachments sends multipart/form-data;
    // plain text-only sends JSON. Branch on the inbound content-type
    // so the multer middleware on the backend gets the format it
    // expects.
    const isMultipart = (
      req.headers.get('content-type') ?? ''
    ).startsWith('multipart/form-data');
    const body = isMultipart ? await req.formData() : await req.json();
    const res = await api.post(`/messages/${id}/reply`, body, {
      headers: { Cookie: cookie.toString() },
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
