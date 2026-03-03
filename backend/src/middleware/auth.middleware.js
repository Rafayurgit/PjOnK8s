import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJwt = async (req, res, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if(!token){
            return res.status(401).json({ message: "Unauthorized request" });
        }
    
        const decodeToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    
        const user = await User.findById(decodeToken._id).select("-password -refreshToken");
    
        if(!user){
            return res.status(401).json({ message: "Invalid Access Token" });

        }
    
        req.user= user
        next()
    } catch (error) {
        return res.status(401).json({ message: error?.message || "Invalid access token" });

    }
}