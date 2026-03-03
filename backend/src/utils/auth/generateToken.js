import dotenv from 'dotenv';
dotenv.config();

import { User } from "../../models/user.model.js"
import jwt from "jsonwebtoken"

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET; 
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const JWT_REFRESH_SECRET= process.env.JWT_REFRESH_SECRET ;

export const generateAccessToken  = async(userId) =>{
    const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is missing!");
    return jwt.sign({
        _id:userId._id.toString(),
        email:userId.email,
        username:userId.username,
        fullName:userId.fullName,
    }, JWT_ACCESS_SECRET, {expiresIn : JWT_EXPIRES_IN})
}

export const generateRefreshToken =async(userId)=>{
    const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is missing!");
    return jwt.sign({
        _id:userId._id.toString(),
    },
    JWT_REFRESH_SECRET,
    {expiresIn:"7d"}
    
)
}

export const verifyToken  = async(token)=>{
    return jwt.verify(token, JWT_ACCESS_SECRET)
}

export const verifyRefreshToken  = async(token)=>{
    return jwt.verify(token, JWT_REFRESH_SECRET)
}