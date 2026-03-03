import React, { useState } from "react";
import PasswordField from "./PasswordField";
import { useAuth } from "../../hooks/useAuth";
import GoogleLoginButton from "./GoogleLoginButton";
import { useNavigate } from "react-router-dom";

export default function SignUpForm() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      console.log("📝 Attempting signup...");
      await signUp(form); // centralized signup + auto login
      await new Promise(resolve => setTimeout(resolve, 100));
    console.log("✅ Signup successful");
    console.log("🍪 Cookies after signup:", document.cookie);

    console.log("🚀 Navigating to dashboard...");
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Header */}


      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          required
          placeholder="Mr jugaadu"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2B55] transition"
        />
      </div>
      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
          placeholder="mrjugaadu"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2B55] transition"
        />
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="you@example.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2B55] transition"
        />
      </div>

      {/* Password Field */}
      <PasswordField
        name="password"
        value={form.password}
        onChange={handleChange}
      />

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 p-2 rounded-md">
          {error}
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-lg text-white font-medium transition duration-200 cursor-pointer ${
          loading
            ? "bg-indigo-400 cursor-not-allowed"
            : "bg-[#1B2B55] hover:bg-indigo-900"
        }`}
      >
        {loading ? "Signing up..." : "Sign Up"}
      </button>

      {/* Divider */}
      <div className="flex items-center justify-center my-2">
        <div className="h-px bg-gray-300 w-1/3"></div>
        <span className="text-gray-500 text-sm mx-2">or</span>
        <div className="h-px bg-gray-300 w-1/3"></div>
      </div>

      {/* Google Signup */}
      <GoogleLoginButton />

      {/* Login Redirect */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{" "}
        <a href="/login" className="text-[#1B2B55] font-medium hover:underline cursor-pointer">
          Login
        </a>
      </p>
    </form>
  );
}
