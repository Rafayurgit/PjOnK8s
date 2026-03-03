import React from "react";

// export default function GoogleLoginButton() {
//   const handelSubmit = () => {
//     window.location.href = `${
//       process.env.REACT_APP_API_URL || "http://localhost:8080"
//     }/api/v1/auth/google`;
//   };

//   return <button onClick={handelSubmit}>Login WIth Google</button>;
// }

export default function GoogleLoginButton() {
  const handleSubmit = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/v1/auth/google`;
  };

  return (
    <button
      onClick={handleSubmit}
      className="w-full py-2 px-4 rounded-lg bg-indigo-50 text-[#1B2B55] font-medium hover:bg-indigo-100 transition duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 48 48"
      >
        <path
          fill="#4285F4"
          d="M24 9.5c3.4 0 6.2 1.2 8.1 2.2l6-6C35.7 2.4 30.2 0 24 0 14.7 0 6.7 5.4 3.1 13l7.1 5.5C11.8 13.5 17.5 9.5 24 9.5z"
        />
        <path
          fill="#34A853"
          d="M46.5 24c0-1.5-.1-2.6-.3-3.8H24v7.2h12.7c-.5 3-2.2 5.5-4.8 7.2l7.4 5.7C44.6 36.7 46.5 30.9 46.5 24z"
        />
        <path
          fill="#FBBC05"
          d="M10.2 28.5l-7.1 5.5C5.1 37.7 14.7 44 24 44c6.4 0 11.8-2.1 15.7-5.7l-7.4-5.7c-2 1.3-4.5 2.1-8.3 2.1-6.4 0-11.1-4.4-12.1-10.2z"
        />
        <path
          fill="#EA4335"
          d="M3.1 13l7.1 5.5c1.1-5.8 5.7-10.2 12.1-10.2 3.8 0 6.3.8 8.3 2.1l7.4-5.7C35.8 2.4 30.4 0 24 0 14.7 0 6.7 5.4 3.1 13z"
        />
      </svg>
      Login with Google
    </button>
  );
}
