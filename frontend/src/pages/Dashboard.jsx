import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="pt-20 min-h-screen bg-background px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Hello, {user?.username}
        </h1>
        <p className="text-gray-500 text-sm mb-8">Here are your AI-powered recommendations</p>

        {/* Placeholder — AI recs wired in Phase 5 (Steps 13–16) */}
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🤖</div>
          <p className="font-medium">Recommendations coming in Phase 5</p>
          <p className="text-sm mt-1">Set your preferences to get personalised picks</p>
          <button
            onClick={() => navigate("/onboarding")}
            className="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-indigo-700 transition"
          >
            Set Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
