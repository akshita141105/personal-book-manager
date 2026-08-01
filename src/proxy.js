import { NextResponse } from "next/server";

export function proxy(request) {
    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;
    const { pathname } = request.nextUrl;

    const isAuthenticated = accessToken || refreshToken;

    // Agar user logged out hai aur dashboard access kar raha hai -> login bhejo
    if (pathname.startsWith("/dashboard") && !isAuthenticated) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Agar user already logged in hai aur login/signup pe ja raha hai -> dashboard bhejo
    if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/signup"],
};    