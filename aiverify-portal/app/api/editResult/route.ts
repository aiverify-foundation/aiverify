import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  const { id, name } = await request.json(); // Extract data from the request body

  try {
    const response = await fetch(`http://127.0.0.1:4000/test_result/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to update result name' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error while updating result name' }, { status: 500 });
  }
}
