import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user, signOut } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-white p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md md:max-w-lg text-center transform transition-transform duration-300 hover:scale-[1.02]">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1B2B55] mb-2">
                    Welcome, {user.email || user}
                </h2>
                <p className="text-gray-700 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8">
                    You’re now inside your secure dashboard.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={signOut}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 cursor-pointer bg-[#1B2B55] text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-md"
                    >
                        Log Out
                    </button>

                    <Link
                        to="/"
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 cursor-pointer bg-[#1B2B55] text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-md"
                    >
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
