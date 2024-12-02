/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// /app/api/upload/route.ts

import { NextResponse } from 'next/server';
import axios from 'axios';
import { getApiKey } from '@/lib/getApiKey';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.15.157.253:3003/api';

export async function POST(request: Request) {
  try {
    const apiKey = getApiKey(request.headers);

    const formData = await request.formData();

    // Pass the FormData directly to axios
    const data = formData;

    const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-api-key': apiKey,
        'x-folder': formData.get('x-folder') as string || 'default',
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error('Upload Files Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to upload files' },
      { status: 500 }
    );
  }
}
