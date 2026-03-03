// src/utils/jwtHelpers.js
import { jwtDecode } from "jwt-decode";

export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return true;
    const now = Date.now() / 1000;
    return decoded.exp < now;
  } catch {
    return true;
  }
};

export const parseUserFromToken = (token) => {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};
