import jwt from "jsonwebtoken";

export function adminAuth(req, res, next) {
    const authHeader = req.headers["authorization"]; // get the Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1]; // get the token part

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.role !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }
        req.admin = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
    }
}
