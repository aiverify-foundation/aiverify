import { NextResponse } from 'next/server';

// Define APIGW_HOST at the top of the file
const APIGW_HOST = process.env.APIGW_HOST || 'http://127.0.0.1:4000';
// console.log('APIGW_HOST', APIGW_HOST);

async function _backendFetch(
  request: Request,
  method: string,
  slug?: string[] | undefined
) {
  const path = slug ? slug.join('/') : '';
  const url = new URL(request.url);
  const searchParam = new URLSearchParams(url.search);
  const backendUrl = new URL(
    path + (searchParam.size > 0 ? '?' + searchParam.toString() : ''),
    APIGW_HOST
  );
  console.log('backendUrl:', backendUrl);

  const response = await fetch(backendUrl, {
    method: method,
    headers: request.headers,
    body: request.body,
    // @ts-ignore
    duplex: 'half',
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  return _backendFetch(request, 'GET', slug);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  return _backendFetch(request, 'POST', slug);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  return _backendFetch(request, 'PUT', slug);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  return _backendFetch(request, 'PATCH', slug);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  return _backendFetch(request, 'DELETE', slug);
}
