import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const GENRES = [
  "Fiction", "Non-Fiction", "Mystery", "Thriller", "Romance",
  "Science Fiction", "Fantasy", "Horror", "Biography", "History",
  "Self-Help", "Philosophy", "Poetry", "Drama", "Adventure",
];

export default function Onboarding({ showToast }) {
  const navigate = useNavigate();

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [authorInput,    setAuthorInput]    = useState("");
  const [authors,        setAuthors]        = useState([]);
  const [loading,        setLoading]        = useState(false);

  const toggleGenre = (genre) =>
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );

  const addAuthor = (e) => {
    if (e.key === "Enter" && authorInput.trim()) {
      setAuthors((prev) => [...new Set([...prev, authorInput.trim()])]);
      setAuthorInput("");
    }
  };

  const removeAuthor = (author) =>
    setAuthors((prev) => prev.filter((a) => a !== author));

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post("/auth/preferences", {
        genres:           selectedGenres,
        favorite_authors: authors,
      });
      showToast?.("Preferences saved!", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast?.(err.response?.data?.error || "Failed to save preferences", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    showToast?.("You can set preferences later from your profile.", "info");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">What do you like to read?</h1>
        <p className="text-sm text-gray-500 mb-6">Pick genres and authors to personalise your recommendations.</p>

        {/* Genre chips */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Genres</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={`px-3 py-1.5 rounded-full text-sm border transition
                  ${selectedGenres.includes(g)
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-gray-600 border-gray-300 hover:border-brand"
                  }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Author input */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Favourite Authors</p>
          <input
            type="text"
            value={authorInput}
            onChange={(e) => setAuthorInput(e.target.value)}
            onKeyDown={addAuthor}
            placeholder="Type an author name and press Enter"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          {authors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {authors.map((a) => (
                <span key={a} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-brand rounded-full text-sm">
                  {a}
                  <button onClick={() => removeAuthor(a)} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave} disabled={loading}
            className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Preferences"}
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
