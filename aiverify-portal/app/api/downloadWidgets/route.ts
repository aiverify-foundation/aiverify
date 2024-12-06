import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const gid = url.searchParams.get('gid');

    if (!gid) {
      return NextResponse.json({ error: 'Missing gid parameter' }, { status: 400 });
    }

    
    // Make the GET request to the backend API
    const backendResponse = await fetch(`http://127.0.0.1:4000/plugins/${gid}/widgets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("backend", backendResponse)

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: errorText || 'Failed to fetch widget file from backend' },
        { status: backendResponse.status }
      );
    }

    // Stream the file back to the client
    const fileBlob = await backendResponse.blob();
    const headers = new Headers({
      'Content-Disposition': backendResponse.headers.get('Content-Disposition') || 'attachment; filename="widget.zip"',
      'Content-Type': backendResponse.headers.get('Content-Type') || 'application/zip',
    });

    return new Response(fileBlob, { headers });
  } catch (error) {
    console.error('Error fetching widget file:', error);
    return NextResponse.json({ error: 'Server error while fetching widget file' }, { status: 500 });
  }
}
