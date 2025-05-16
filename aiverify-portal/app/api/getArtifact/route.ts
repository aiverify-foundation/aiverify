import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const name = url.searchParams.get('name');

  if (!id || !name) {
    return NextResponse.json(
      { error: 'Missing id or name parameter' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${process.env.APIGW_HOST}/test_results/${id}/artifacts/${name}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get artifact' },
        { status: response.status }
      );
    }

    // Extract headers
    const contentType = response.headers.get('Content-Type') || '';
    const contentDisposition =
      response.headers.get('Content-Disposition') || '';
    console.log('backend contentype:', contentType);
    console.log('backend contentdisposition:', contentDisposition);

    // Pass through the response body and headers
    const blob = await response.blob();
    return new NextResponse(blob, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error) {
    console.error('Error fetching artifact:', error);
    return NextResponse.json(
      { error: 'Server error while getting artifact' },
      { status: 500 }
    );
  }
}
