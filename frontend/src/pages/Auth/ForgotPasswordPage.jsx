import React, { useState } from "react";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data } = await forgotPassword(email);
    setMsg(data.message);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-indigo-50 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-[#1B2B55] mb-4">
          Forgot Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B2B55]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            className="w-full py-2 bg-[#1B2B55] text-white rounded-lg hover:bg-indigo-900 transition"
          >
            Send Reset Link
          </button>
        </form>

        {msg && (
          <p className="mt-4 text-center text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded-md">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
