import express from "express";
import { runBacktest } from "../services/backtest";

const router = express.Router();
router.post("/", runBacktest);
export default router;
