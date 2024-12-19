import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  const { gid } = await request.json();
  console.log('Deleting result with gid:', gid);

  try {
    const response = await fetch(`http://127.0.0.1:4000/plugins/${gid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gid }),
    });

    console.log('Backend response status:', response.status);

    // Check if the response status is OK
    if (response.status === 200) {
      const body = await response.text();  // Read the response body as text

      if (body === '') {
        // If the body is empty, return a success message
        return NextResponse.json({ message: 'Result deleted successfully.' }, { status: 200 });
      }

      // If the body contains data, try to parse it as JSON
      try {
        const data = JSON.parse(body);  // Using JSON.parse here instead of response.json()
        return NextResponse.json(data, { status: 200 });
      } catch (parseError) {
        console.error('Error parsing response body:', parseError);
        return NextResponse.json({ error: 'Failed to parse response body' }, { status: 500 });
      }
    }

    // If the response is not OK, read the body and log the error
    const errorData = await response.text();
    console.error('Error response from backend:', errorData);
    return NextResponse.json({ error: errorData || 'Failed to delete result' }, { status: response.status });

  } catch (error) {
    console.error('Error while deleting result:', error);
    return NextResponse.json({ error: 'Server error while deleting result' }, { status: 500 });
  }
}
