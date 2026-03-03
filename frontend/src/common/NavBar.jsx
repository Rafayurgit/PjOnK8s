import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import photojugaad2 from "../assets/photojugaad2.png"

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-blur backdrop-blur-md  shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-14">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-lg font-semibold text-bg-[#1B2B55] hover:text-indigo-900 transition-colors duration-200"
          >
            <img src={photojugaad2} 
            className="w-15 h-15"
            alt=""
             />
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-[#1B2B55] transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link
                to="/login"
                className="px-4 py-1.5 border border-[#1B2B55] text-bg-[#1B2B55] rounded-md text-sm font-medium hover:bg-indigo-50 transition duration-200"
              >
                Login
              </Link>
              <Link
                to="/signIn"
                className="px-4 py-1.5 bg-[#1B2B55] text-white rounded-md text-sm font-medium hover:bg-indigo-800 transition duration-200"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative">
              {/* Profile button */}
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className=" flex items-center gap-2 bg-[#1B2B55] text-white px-0.5 py-0.5 cursor-pointer rounded-full hover:bg-indigo-800 transition duration-200"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.email || "User"
                  )}&background=1B2B55&color=fff`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
                
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2 animate-fade-in"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <p className="px-3 py-2 text-sm text-gray-600 border-b">
                    {user.email?.split("@")[0] ||user.email || "User" }
                  </p>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 rounded-md"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
