import { Router } from "express";
import { loginAdmin } from "../controllers/authController.js";
export const authRouter = Router();

authRouter.post("/login", loginAdmin);