import { NextResponse } from "next/server";

export function proxy(request) {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    const { pathname } = request.nextUrl;

    const isAuthenticated = accessToken || refreshToken;

    let response;

    if (pathname.startsWith("/dashboard") && !isAuthenticated) {
        response = NextResponse.redirect(new URL("/login", request.url));
    }
    else if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
        response = NextResponse.redirect(new URL("/dashboard", request.url));
    }
    else {
        response = NextResponse.next();
    }

    response.headers.set("Cache-Control", "no-store, must-revalidate");

    return response;
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/signup"],
};