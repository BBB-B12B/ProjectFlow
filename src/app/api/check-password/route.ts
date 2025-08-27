import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const expectedPassword = process.env.OS_TEAM_PASSWORD;

    if (!expectedPassword) {
      console.error('OS_TEAM_PASSWORD is not set in environment variables.');
      return NextResponse.json({ success: false, message: 'Server configuration error: Password not set.' }, { status: 500 });
    }

    if (password === expectedPassword) {
      return NextResponse.json({ success: true, message: 'Password correct. Dark mode unlocked.' });
    } else {
      return NextResponse.json({ success: false, message: 'Incorrect password.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error in check-password API:', error);
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
