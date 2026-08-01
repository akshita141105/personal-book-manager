"use client";
import { apiFetch } from "@/lib/apiClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STATUS_CONFIG = {
    "want-to-read": { label: "Want to Read", emoji: "📖", hex: "#f59e0b" },
    "reading": { label: "Reading", emoji: "📘", hex: "#3b82f6" },
    "completed": { label: "Completed", emoji: "✅", hex: "#22c55e" },
};

function BookCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-5 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="flex gap-1.5 mb-4">
                <div className="h-5 bg-gray-200 rounded-full w-14"></div>
                <div className="h-5 bg-gray-200 rounded-full w-16"></div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
        </div>
    );
}

function StatCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-3.5 sm:p-6 border border-gray-100 shadow-sm animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-20 mb-3"></div>
            <div className="h-7 bg-gray-200 rounded w-10"></div>
        </div>
    );
}

let toastId = 0;

export default function DashboardPage() {
    const router = useRouter();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [formData, setFormData] = useState({ title: "", author: "", tags: "", status: "want-to-read" });
    const [darkMode, setDarkMode] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null); 
    const [tagFilter, setTagFilter] = useState("all");

    useEffect(() => {
        fetchBooks();
    }, []);

    function showToast(message, type = "success") {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }

    async function fetchBooks() {
        setLoading(true);
        try {
            const res = await apiFetch("/api/books");
            if (res.status === 401) {
                router.push("/login");
                return;
            }
            const data = await res.json();
            setBooks(data.books || []);
        } catch (err) {
            console.error("Failed to fetch books:", err);
            showToast("Failed to load books", "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await apiFetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    function openAddForm() {
        setEditingBook(null);
        setFormData({ title: "", author: "", tags: "", status: "want-to-read" });
        setShowForm(true);
    }

    function openEditForm(book) {
        setEditingBook(book);
        setFormData({
            title: book.title,
            author: book.author,
            tags: book.tags.join(", "),
            status: book.status,
        });
        setShowForm(true);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        const payload = {
            title: formData.title,
            author: formData.author,
            status: formData.status,
            tags: formData.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        };

        try {
            const res = editingBook
                ? await apiFetch(`/api/books/${editingBook._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                : await apiFetch("/api/books", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

            if (!res.ok) {
                showToast("Something went wrong while saving", "error");
                return;
            }

            showToast(editingBook ? "Book updated successfully" : "Book added successfully");
            setShowForm(false);
            fetchBooks();
        } catch (err) {
            console.error("Failed to save book:", err);
            showToast("Something went wrong", "error");
        }
    }

    // Step 1: user clicks "Delete" on a card -> just remember which book, open our own modal
    function askDeleteConfirm(id) {
        setDeleteConfirm(id);
    }

    // Step 2: user confirms inside our custom modal -> actually call the API
    async function confirmDelete() {
        const id = deleteConfirm;
        setDeleteConfirm(null);

        try {
            const res = await apiFetch(`/api/books/${id}`, { method: "DELETE" });

            if (!res.ok) {
                showToast("Failed to delete book", "error");
                return;
            }

            showToast("Book deleted");
            fetchBooks();
        } catch (err) {
            console.error("Failed to delete book:", err);
            showToast("Failed to delete book", "error");
        }
    }

    async function handleStatusChange(id, newStatus) {
        try {
            const res = await apiFetch(`/api/books/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                showToast("Failed to update status", "error");
                return;
            }

            fetchBooks();
        } catch (err) {
            console.error("Failed to update status:", err);
            showToast("Failed to update status", "error");
        }
    }

    const allTags = [...new Set(books.flatMap((b) => b.tags))];

    const filteredBooks = books
        .filter((b) => activeFilter === "all" || b.status === activeFilter)
        .filter((b) => tagFilter === "all" || b.tags.includes(tagFilter))
        .filter((b) => {
            const q = searchQuery.toLowerCase();
            return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
        });

    const stats = {
        total: books.length,
        reading: books.filter((b) => b.status === "reading").length,
        completed: books.filter((b) => b.status === "completed").length,
    };

    const theme = darkMode
        ? {
            page: "bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950",
            header: "bg-gray-900/80 border-gray-800",
            headerText: "text-gray-100",
            card: "bg-gray-800 border-gray-700",
            text: "text-gray-100",
            subtext: "text-gray-400",
            input: "bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500",
            tabInactive: "bg-gray-800 text-gray-300 border-gray-700 hover:border-indigo-500 hover:text-indigo-400",
            emptyBg: "bg-gray-800 border-gray-700",
            modalBg: "bg-gray-800",
            cancelBtn: "border-gray-700 text-gray-300 hover:bg-gray-700",
            tagPill: "bg-gray-700 text-gray-300",
            divider: "border-gray-700",
            select: "border-gray-700 text-gray-200 bg-gray-900",
            statusBadge: {
                "want-to-read": "bg-amber-900/40 text-amber-300 border-amber-800",
                "reading": "bg-blue-900/40 text-blue-300 border-blue-800",
                "completed": "bg-green-900/40 text-green-300 border-green-800",
            },
        }
        : {
            page: "bg-gradient-to-br from-indigo-50/40 via-gray-50 to-purple-50/40",
            header: "bg-white/80 border-gray-100",
            headerText: "text-gray-900",
            card: "bg-white border-gray-100",
            text: "text-gray-900",
            subtext: "text-gray-500",
            input: "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400",
            tabInactive: "bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600",
            emptyBg: "bg-white border-gray-100",
            modalBg: "bg-white",
            cancelBtn: "border-gray-200 text-gray-600 hover:bg-gray-50",
            tagPill: "bg-gray-100 text-gray-600",
            divider: "border-gray-100",
            select: "border-gray-200 text-gray-600 bg-white",
            statusBadge: {
                "want-to-read": "bg-amber-100 text-amber-700 border-amber-200",
                "reading": "bg-blue-100 text-blue-700 border-blue-200",
                "completed": "bg-green-100 text-green-700 border-green-200",
            },
        };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme.page}`}>
            {/* Toasts */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-fade-in-up ${toast.type === "error" ? "bg-red-500" : "bg-green-500"
                            }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Header */}
            <header className={`backdrop-blur-sm border-b sticky top-0 z-10 transition-colors duration-300 ${theme.header}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-base sm:text-lg shadow-md shadow-indigo-200">
                            📚
                        </div>
                        <span className={`font-bold text-base sm:text-lg ${theme.headerText}`}>My Books</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition ${darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"
                                }`}
                            title="Toggle theme"
                        >
                            {darkMode ? "☀️" : "🌙"}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 font-medium transition px-3 py-1.5 rounded-lg"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
                    {loading ? (
                        <>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </>
                    ) : (
                        <>
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-3.5 sm:p-6 shadow-md shadow-indigo-200 hover:shadow-lg transition">
                                <p className="text-indigo-100 text-[11px] sm:text-sm font-medium leading-tight">Total Books</p>
                                <p className="text-xl sm:text-3xl font-bold text-white mt-1">{stats.total}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-3.5 sm:p-6 shadow-md shadow-blue-200 hover:shadow-lg transition">
                                <p className="text-blue-50 text-[11px] sm:text-sm font-medium leading-tight">Reading</p>
                                <p className="text-xl sm:text-3xl font-bold text-white mt-1">{stats.reading}</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl p-3.5 sm:p-6 shadow-md shadow-green-200 hover:shadow-lg transition">
                                <p className="text-emerald-50 text-[11px] sm:text-sm font-medium leading-tight">Completed</p>
                                <p className="text-xl sm:text-3xl font-bold text-white mt-1">{stats.completed}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Search bar */}
                <div className="relative mb-4">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title or author..."
                        className={`w-full border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${theme.input}`}
                    />
                </div>

                {/* Filter tabs + Add button */}
                {/* Filter tabs + Add button */}
                <div className="flex flex-col gap-3 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        {["all", "want-to-read", "reading", "completed"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveFilter(status)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeFilter === status
                                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                                    : `border ${theme.tabInactive}`
                                    }`}
                            >
                                {status === "all" ? "All" : STATUS_CONFIG[status].label}
                            </button>
                        ))}

                        {allTags.length > 0 && (
                            <select
                                value={tagFilter}
                                onChange={(e) => setTagFilter(e.target.value)}
                                className={`px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${theme.input}`}
                            >
                                <option value="all">All Tags</option>
                                {allTags.map((tag) => (
                                    <option key={tag} value={tag}>
                                        {tag}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <button
                        onClick={openAddForm}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md shadow-indigo-200 w-full sm:w-auto sm:self-end"
                    >
                        + Add Book
                    </button>
                </div>

                {/* Book grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <BookCardSkeleton />
                        <BookCardSkeleton />
                        <BookCardSkeleton />
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div className={`text-center py-16 rounded-2xl border ${theme.emptyBg}`}>
                        <p className="text-4xl mb-3">{books.length === 0 ? "📚" : "🔍"}</p>
                        <p className={`${theme.subtext} mb-4`}>
                            {books.length === 0 ? "No books here yet." : "No books match your search."}
                        </p>
                        {books.length === 0 && (
                            <button
                                onClick={openAddForm}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition"
                            >
                                + Add your first book
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBooks.map((book, index) => (
                            <div
                                key={book._id}
                                className={`rounded-2xl p-5 border-l-4 border shadow-sm hover:shadow-md transition animate-fade-in-up ${theme.card}`}
                                style={{
                                    borderLeftColor: STATUS_CONFIG[book.status].hex,
                                    animationDelay: `${index * 60}ms`,
                                }}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                        style={{ backgroundColor: STATUS_CONFIG[book.status].hex }}
                                    >
                                        {book.title.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-semibold leading-tight truncate ${theme.text}`}>{book.title}</h3>
                                        <p className={`text-sm ${theme.subtext}`}>{book.author}</p>
                                    </div>
                                    <span
                                        className={`text-xs font-medium px-2 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${theme.statusBadge[book.status]}`}
                                    >
                                        {STATUS_CONFIG[book.status].emoji}
                                    </span>
                                </div>

                                {book.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {book.tags.map((tag) => (
                                            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${theme.tagPill}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t ${theme.divider}`}>
                                    <select
                                        value={book.status}
                                        onChange={(e) => handleStatusChange(book._id, e.target.value)}
                                        className={`text-xs border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-auto ${theme.select}`}
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                            <option key={key} value={key}>
                                                {cfg.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex gap-4 text-xs justify-end">
                                        <button onClick={() => openEditForm(book)} className="text-indigo-600 hover:underline font-medium">
                                            Edit
                                        </button>
                                        <button onClick={() => askDeleteConfirm(book._id)} className="text-red-500 hover:underline font-medium">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-20">
                    <div className={`rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-xl ${theme.modalBg}`}>
                        <h2 className={`text-lg font-bold mb-4 ${theme.text}`}>{editingBook ? "Edit Book" : "Add a Book"}</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="mb-3">
                                <label className={`block text-sm font-medium mb-1 ${theme.text}`}>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme.input}`}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className={`block text-sm font-medium mb-1 ${theme.text}`}>Author</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme.input}`}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className={`block text-sm font-medium mb-1 ${theme.text}`}>
                                    Tags <span className={theme.subtext}>(comma separated)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="fiction, self-help"
                                    className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme.input}`}
                                />
                            </div>
                            <div className="mb-5">
                                <label className={`block text-sm font-medium mb-1 ${theme.text}`}>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme.input}`}
                                >
                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                        <option key={key} value={key}>
                                            {cfg.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className={`flex-1 border py-2.5 rounded-lg font-medium transition ${theme.cancelBtn}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition"
                                >
                                    {editingBook ? "Save Changes" : "Add Book"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal (replaces browser's native confirm()) */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30 px-4">
                    <div className={`rounded-2xl p-6 w-full max-w-sm shadow-xl ${theme.modalBg}`}>
                        <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-xl mb-3">
                            🗑️
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${theme.text}`}>Delete this book?</h3>
                        <p className={`text-sm mb-5 ${theme.subtext}`}>This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className={`flex-1 border py-2.5 rounded-lg font-medium transition ${theme.cancelBtn}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}