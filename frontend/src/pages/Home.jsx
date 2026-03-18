import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Discover Books You'll <span className="text-brand">Love</span>
        </h1>
        <p className="text-gray-500 text-lg mb-8">
          AI-powered recommendations, free full-text reads, and a personal library — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/search")}
            className="px-6 py-3 bg-brand text-white rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Browse Books
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              Get Recommendations
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              My Dashboard
            </button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "🤖", title: "AI Recommendations", desc: "Personalised picks based on what you read and love." },
          { icon: "📖", title: "Free Full-Text Reads", desc: "Read thousands of classic books directly in your browser." },
          { icon: "📚", title: "Personal Library", desc: "Save, track, and manage your reading list in one place." },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
