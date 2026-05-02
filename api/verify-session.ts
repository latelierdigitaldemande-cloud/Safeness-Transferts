import Stripe from "stripe";
import { Request, Response } from "express";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
  }
  return new Stripe(key, {
    apiVersion: "2025-01-27.acacia" as any,
  });
};

export default async function handler(req: Request, res: Response) {
  const { session_id } = req.query;

  if (!session_id || typeof session_id !== "string") {
    return res.status(400).json({ error: "Session ID is required" });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      return res.status(200).json({ status: "success" });
    } else {
      return res.status(200).json({ status: "unpaid", payment_status: session.payment_status });
    }
  } catch (error: any) {
    console.error("Session verification error:", error);
    return res.status(500).json({ error: "Failed to verify session" });
  }
}
