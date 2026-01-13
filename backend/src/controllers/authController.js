import jwt from 'jsonwebtoken';
import { createActivityLog } from '../services/activityLogService.js';

export const loginAdmin = async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }
    const check = password === process.env.ADMIN_PASSWORD;
    if (!check) {
        // Log failed login attempt
        await createActivityLog('SYSTEM', 'Failed admin login attempt', 'SYSTEM');
        return res.status(401).json({ error: "Invalid password" });
    }
    // Log successful login
    await createActivityLog('ADMIN', 'Admin login successful', 'SYSTEM');
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.status(200).json({ token });
}
