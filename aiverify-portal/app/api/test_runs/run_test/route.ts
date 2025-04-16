import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('API route handler received test data:', body);

    // Forward the request to the API server
    const apiHost = process.env.APIGW_HOST;
    const response = await fetch(`${apiHost}/test_runs/run_test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // If the response is not okay, handle the error
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API server error:', errorText);
      return NextResponse.json(
        { error: 'Failed to run test', details: errorText },
        { status: response.status }
      );
    }

    // Return the successful response
    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in test run API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
