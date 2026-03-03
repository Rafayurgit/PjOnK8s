// src/services/authService.js
import api from "../api/axiosClient";

export const signIn = (email, password) => api.post("/api/v1/auth/signIn", { email, password });
export const signUp = (payload) => api.post("/api/v1/auth/signUp", payload);
// export const refresh = () => api.post("/api/v1/auth/refresh");
export const refresh = () => api.post("/api/v1/auth/refresh", {}, { withCredentials: true });

export const logOut = () => api.post("/api/v1/auth/logOut", {}, {withCredentials:true});
export const changePassword = (payload) => api.post("/api/v1/auth/changePassword", payload);

export const forgotPassword = (email) =>api.post("/api/v1/auth/forgot-password", { email });
export const resetPassword = (payload) =>api.post("/api/v1/auth/reset-password", payload);
