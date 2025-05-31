import jwt from "jsonwebtoken";
import { promisify } from "util";

const verifyAsync = promisify(jwt.verify);

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token yok." });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token yok." });

    const user = await verifyAsync(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: "Geçersiz token." });
  }
};

export default authMiddleware;
