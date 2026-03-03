import React from 'react';
import SignUpForm from '../../components/forms/SignUpForm';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-indigo-50 px-4">
      <div className="w-full max-w-md sm:max-w-sm md:max-w-md lg:max-w-lg p-6 sm:p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl sm:text-xl md:text-2xl font-bold text-center text-[#1B2B55] mb-6">
          Create Your Account
        </h2>
        <SignUpForm />
      </div>
    </div>
  );
}
