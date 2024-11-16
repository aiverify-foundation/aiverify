import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const name = url.searchParams.get('name');

  if (!id || !name) {
    return NextResponse.json({ error: 'Missing id or name parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(`http://127.0.0.1:4000/test_result/${id}/artifacts/${name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("response status: ", response.status)

    if (response.status === 200) {
      return NextResponse.json({ error: 'Failed to get artifact' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.log("backend status: here")
    return NextResponse.json({ error: 'Server error while getting artifact' }, { status: 500 });
  }
}
