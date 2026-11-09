import { NextRequest, NextResponse } from "next/server";
import { auth } from "@workspace/auth";

export async function proxy(request: NextRequest) {
  try {
    // In the proxy runtime, incoming headers must be read from `request.headers`.
    // `next/headers` is a render-context API and is not reliably scoped here.
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  } catch (err) {
    // Fail open on transient infrastructure errors (DB unreachable, etc.) so a
    // blip doesn't 500 every request or wedge the router in a retry loop.
    // The protected page client and the API still enforce auth on their own.
    console.warn("Proxy session check failed:", err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/dashboard/:path*"], // Specify the routes the proxy applies to
};
