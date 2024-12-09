import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const gid = url.searchParams.get('gid');
    const cid = url.searchParams.get('cid');

    if (!gid || !cid ) {
      return NextResponse.json({ error: 'Missing gid or cid parameter' }, { status: 400 });
    }

    
    // Make the GET request to the backend API
    const backendResponse = await fetch(`http://127.0.0.1:4000/plugins/${gid}/algorithms/${cid}`, {
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
        { error: errorText || 'Failed to fetch algorithm file from backend' },
        { status: backendResponse.status }
      );
    }

    // Stream the file back to the client
    const fileBlob = await backendResponse.blob();
    const headers = new Headers({
      'Content-Disposition': backendResponse.headers.get('Content-Disposition') || 'attachment; filename="algorithm.zip"',
      'Content-Type': backendResponse.headers.get('Content-Type') || 'application/zip',
    });

    return new Response(fileBlob, { headers });
  } catch (error) {
    console.error('Error fetching algorithm file:', error);
    return NextResponse.json({ error: 'Server error while fetching algorithm file' }, { status: 500 });
  }
}
