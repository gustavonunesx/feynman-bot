import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next/|favicon.ico|login|api/login).*)"],
};

const COOKIE_NAME = "feynman_auth";

export async function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  // sem SITE_PASSWORD configurada, o gate fica desligado (ex: dev local)
  if (!password) {
    return NextResponse.next();
  }

  const expected = await sha256(password);
  const cookie = request.cookies.get(COOKIE_NAME)?.value;

  if (cookie && timingSafeEqual(cookie, expected)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
