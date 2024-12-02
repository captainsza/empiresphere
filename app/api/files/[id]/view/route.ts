/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// /app/api/files/[id]/view/route.ts
import { NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://103.15.157.253:3003';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const { id } = params;

  console.log(`[GET] File view request initiated for fileId: ${id}`);

  try {
    // Extract API key from headers or query parameters
    let apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      const url = new URL(request.url);
      apiKey = url.searchParams.get('apiKey');
    }

    if (!apiKey) {
      console.log('[Auth] No API key provided');
      return new Response(JSON.stringify({ error: 'No API key provided.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const backendUrl = `${API_BASE_URL}/api/files/${id}/view`;
    console.log(`[Backend] Making request to: ${backendUrl}`);

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    console.log(`[Backend] Response status: ${backendResponse.status}`);

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.log(`[Backend] Error response:`, errorData);
      return new Response(JSON.stringify({ error: errorData.error || 'Failed to fetch the file.' }), {
        status: backendResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pass through the response
    const contentType = backendResponse.headers.get('Content-Type') || 'application/octet-stream';
    const contentDisposition = backendResponse.headers.get('Content-Disposition') || 'attachment';

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error: any) {
    console.error('[Error] Error fetching the file:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error while fetching the file.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
