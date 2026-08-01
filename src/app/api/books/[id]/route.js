import connectDB from "@/lib/db";
import Book from "@/models/Book";
import { getUserIdFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const updates = await request.json();

        await connectDB();

        const book = await Book.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true }
        );

        if (!book) {
            return NextResponse.json(
                { error: "Book not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ book }, { status: 200 });
    } catch (error) {
        console.error("Update book error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const book = await Book.findOneAndDelete({ _id: id, userId });

        if (!book) {
            return NextResponse.json(
                { error: "Book not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Book deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete book error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}