import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const gid = url.searchParams.get('gid');

  try {
    const response = await fetch(`http://127.0.0.1:4000/plugins/${gid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);

    if (response.status === 200) {
        const body = await response.text();
        if (body === '') {
            //console.log('delete 2')
            return NextResponse.json({ message: 'Plugin deleted successfully.' }, { status: 200 });
        }
      // In case content in the body, parse
      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    }

    // If not 200 OK, read the response body as text
    const errorData = await response.text();
    console.error('Error response from backend:', errorData);
    return NextResponse.json({ error: errorData || 'Failed to delete plugin' }, { status: response.status });

  } catch (error) {
    console.error('Error while deleting plugin:', error);
    return NextResponse.json({ error: 'Server error while deleting plugin' }, { status: 500 });
  }
}