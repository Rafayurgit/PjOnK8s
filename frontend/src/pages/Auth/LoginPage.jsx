import React from 'react';
import LoginForm from '../../components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-indigo-50 px-4">
      <div className="w-full max-w-md sm:max-w-sm md:max-w-md lg:max-w-lg p-6 sm:p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl sm:text-xl md:text-2xl font-bold text-center text-[#1B2B55] mb-6">
          Login to DesiPix
        </h2>
        <LoginForm />
      </div>
    </div>
  );
}
