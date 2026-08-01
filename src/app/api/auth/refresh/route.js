import { verifyRefreshToken, generateAccessToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const refreshToken = request.cookies.get("refreshToken")?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { error: "No refresh token found" },
                { status: 401 }
            );
        }

        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid or expired refresh token" },
                { status: 401 }
            );
        }

        const newAccessToken = generateAccessToken(decoded.userId);
        
        const response = NextResponse.json(
            { message: "Token refreshed" },
            { status: 200 }
        );

        response.cookies.set("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Refresh error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}