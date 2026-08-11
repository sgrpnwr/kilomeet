import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express's Request type so TypeScript knows req.userId can exist
export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // Standard convention: token sent as "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // "Bearer xyz123" -> "xyz123"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId; // attach it for the route handler to use
    next(); // move on to the actual route
  } catch (err) {
    // Covers both an invalid signature (tampered token) and an expired token
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}