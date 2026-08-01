import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export function generateAccessToken(userId) {
    return jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId) {
    return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, ACCESS_SECRET);
    } catch (error) {
        return null;
    }
}

export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, REFRESH_SECRET);
    } catch (error) {
        return null;
    }
}

// src/lib/auth.js mein existing functions ke saath ye bhi add karo

export function getUserIdFromRequest(request) {
    const accessToken = request.cookies.get("accessToken")?.value;
    if (!accessToken) return null;

    const decoded = verifyAccessToken(accessToken);
    if (!decoded) return null;

    return decoded.userId;
}