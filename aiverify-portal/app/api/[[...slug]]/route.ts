import { NextResponse } from 'next/server';

// Define APIGW_HOST at the top of the file
const APIGW_HOST = process.env.APIGW_HOST || 'http://127.0.0.1:4000';
// console.log('APIGW_HOST', APIGW_HOST);

async function _backendFetch(
  request: Request,
  method: string,
  slug?: string[] | undefined
) {
  // console.log('request:', request);
  const path = slug ? slug.join('/') : '';
  const url = new URL(request.url);
  // console.log('path:', path);
  // console.log('url:', url);
  const searchParam = new URLSearchParams(url.search);
  let mypath =
    path + (searchParam.size > 0 ? '?' + searchParam.toString() : '');
  if (request.url.endsWith('/') && !mypath.endsWith('/')) {
    mypath += '/';
  }
  const backendUrl = new URL(mypath, APIGW_HOST);
  // console.log('backendUrl:', backendUrl);

  try {
    const body = ['GET', 'HEAD'].includes(request.method)
      ? null
      : await request.blob();
    // console.log('body:', body);
    let response = await fetch(backendUrl, {
      method: method,
      headers: request.headers,
      body,
      // @ts-ignore
      // duplex: 'half',
      redirect: 'manual',
    });
    // console.log('response:', response);

    if (response.status === 307 && response.headers.has('location')) {
      response = await fetch(
        response.headers.get('location') || backendUrl + '/',
        {
          method: method,
          headers: request.headers,
          body,
        }
      );
      // console.log('response 2:', response);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (e: unknown) {
    console.log('apigw fetch error: ', e);
    if (e instanceof Error) {
      return new NextResponse(e.message, { status: 500 });
    } else {
      return new NextResponse('Unknown error', { status: 500 });
    }
  }
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
