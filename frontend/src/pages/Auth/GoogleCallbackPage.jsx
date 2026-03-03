import React from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';
import api from '../../api/axiosClient';

// export default function GoogleCallbackPage() {

//     const navigate = useNavigate();
//     const {setTokenInMemory } = useAuth();

//     useEffect(()=>{
//         (async()=>{
//             try {
//                 const {data} = await api.post("/auth/refresh");
//                 setTokenInMemory(data.accessToken);
//                 navigate("/dashboard");
//             } catch (error) {
//                 navigate("/login");
//             }
//         })()
//     },[navigate, setTokenInMemory])

//   return (
//     <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-100 to-white">
//             <div className="text-center p-6 bg-white rounded-xl shadow-md">
//                 <p className="text-lg font-medium text-gray-700 animate-pulse">
//                     Signing you in with Google...
//                 </p>
//             </div>
//         </div>
//   )
// }

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { refresh, setTokenInMemory } = useAuth(); // ✅ Get refresh from context

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        console.log("🔄 Google callback: waiting for cookies to be set...");
        
        // ✅ Wait a bit for cookies to be fully set by browser after redirect
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log("🍪 Cookies after Google redirect:", document.cookie);
        
        // ✅ Use the refresh function from AuthContext (uses correct route)
        const success = await refresh();
        
        if (success && isMounted) {
          console.log("✅ Google login successful, redirecting to dashboard");
          navigate("/dashboard");
        } else if (isMounted) {
          console.error("❌ Google login failed, redirecting to login");
          navigate("/login");
        }
      } catch (error) {
        console.error("❌ Google callback error:", error);
        if (isMounted) navigate("/login");
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, [navigate, refresh]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-100 to-white">
      <div className="text-center p-6 bg-white rounded-xl shadow-md">
        <p className="text-lg font-medium text-gray-700 animate-pulse">
          Completing Google sign-in...
        </p>
      </div>
    </div>
  );
}