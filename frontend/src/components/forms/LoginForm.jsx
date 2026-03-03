import React, { useState } from "react";
import PasswordField from "./PasswordField";
import { useAuth } from "../../hooks/useAuth";
import GoogleLoginButton from "./GoogleLoginButton";
import { Link, useNavigate } from "react-router-dom";

export default function LoginForm() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
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
      console.log("🔐 Attempting login...");
      // await signIn(form);
      const result = await signIn(form);

      console.log("✅ Login successful, result:", result);
      console.log("🍪 Cookies after login:", document.cookie);

      await new Promise(resolve => setTimeout(resolve, 100));

      console.log("🚀 Navigating to dashboard...");
      navigate("/dashboard", { replace: true });

    } catch (err) {

      setError(err.response?.data?.message || err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
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

      {/* Password */}
      <PasswordField
        name="password"
        value={form.password}
        onChange={handleChange}
        label="Password"
      />

      {/* Forgot Password */}
      <div className="flex justify-end -mt-2">
        <Link
          to="/forgot-password"
          className="text-sm text-[#1B2B55] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-200 p-2 rounded-md">
          {error}

          <div className="text-xs mt-2">
            <Link
              to="/forgot-password"
              className="text-[#1B2B55] font-medium underline"
            >
              Reset your password
            </Link>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-lg text-white font-medium transition duration-200 cursor-pointer ${
          loading
            ? "bg-indigo-400 cursor-not-allowed"
            : "bg-[#1B2B55] hover:bg-indigo-900"
        }`}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {/* Divider */}
      <div className="flex items-center justify-center my-2">
        <div className="h-px bg-gray-300 w-1/3"></div>
        <span className="text-gray-500 text-sm mx-2">or</span>
        <div className="h-px bg-gray-300 w-1/3"></div>
      </div>

      {/* Google */}
      <GoogleLoginButton />

      {/* Signup redirect */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Don’t have an account?{" "}
        <Link to="/signIn" className="text-[#1B2B55] font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
