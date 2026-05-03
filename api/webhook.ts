import Stripe from "stripe";
import { Request, Response } from "express";
import { Resend } from "resend";
import { Readable } from "stream";

// Utility to read the raw body from the request stream (for Vercel with bodyParser: false)
async function buffer(readable: Readable) {
  const chunks: any[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
  }
  return new Stripe(key, {
    apiVersion: "2025-01-27.acacia" as any,
  });
};

const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is missing from environment variables");
  }
  return new Resend(key);
};

export default async function handler(req: Request, res: Response) {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: "Missing signature or webhook secret" });
  }

  let event;

  try {
    // On Vercel with bodyParser: false, req is a stream that hasn't been read.
    // In our local Express dev server, it's already a Buffer thanks to express.raw().
    const rawBody = Buffer.isBuffer(req.body) ? req.body : await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata) {
      const resend = getResend();
      const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";

      try {
        // Email for the customer
        await resend.emails.send({
          from: "Safeness & Transferts <onboarding@resend.dev>",
          to: metadata.email,
          subject: "Confirmation de votre réservation - Safeness & Transferts",
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h1 style="color: #000;">Merci pour votre réservation !</h1>
              <p>Votre paiement a été confirmé. Voici le récapitulatif de votre transfert :</p>
              <hr />
              <p><strong>Départ :</strong> ${metadata.pickup}</p>
              <p><strong>Arrivée :</strong> ${metadata.dropoff}</p>
              <p><strong>Date/Heure :</strong> ${metadata.time}</p>
              <p><strong>Véhicule :</strong> ${metadata.vehicle}</p>
              <p><strong>Passagers :</strong> ${metadata.passengers}</p>
              <p><strong>Bagages :</strong> ${metadata.luggage}</p>
              <p><strong>Extras :</strong> ${metadata.extras}</p>
              <p><strong>Trajet retour :</strong> ${metadata.isReturnTrip === 'true' ? 'Oui' : 'Non'}</p>
              <hr />
              <p><strong>Prix total payé :</strong> ${amount} €</p>
              <p>Un chauffeur vous contactera peu avant l'heure prévue.</p>
              <p>À bientôt,<br />L'équipe Safeness & Transferts</p>
            </div>
          `,
        });

        // Email for the admin
        await resend.emails.send({
          from: "Safeness & Transferts <onboarding@resend.dev>",
          to: "autowebaws@gmail.com", // Adress to notify
          subject: "Nouvelle réservation confirmée !",
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h1>Nouvelle réservation reçue</h1>
              <p>Un client vient de payer une réservation :</p>
              <hr />
              <p><strong>Client :</strong> ${metadata.firstName} ${metadata.lastName}</p>
              <p><strong>Email :</strong> ${metadata.email}</p>
              <p><strong>Téléphone :</strong> ${metadata.phone}</p>
              <p><strong>Numéro de vol/train :</strong> ${metadata.flightNumber}</p>
              <hr />
              <p><strong>Départ :</strong> ${metadata.pickup}</p>
              <p><strong>Arrivée :</strong> ${metadata.dropoff}</p>
              <p><strong>Date/Heure :</strong> ${metadata.time}</p>
              <p><strong>Véhicule :</strong> ${metadata.vehicle}</p>
              <p><strong>Passagers :</strong> ${metadata.passengers}</p>
              <p><strong>Bagages :</strong> ${metadata.luggage}</p>
              <p><strong>Extras :</strong> ${metadata.extras}</p>
              <p><strong>Trajet retour :</strong> ${metadata.isReturnTrip === 'true' ? 'Oui' : 'Non'}</p>
              <hr />
              <p><strong>Montant payé :</strong> ${amount} €</p>
            </div>
          `,
        });
        
        console.log(`Emails sent for session: ${session.id}`);
      } catch (emailError) {
        console.error("Failed to send emails:", emailError);
      }
    }
  }

  return res.status(200).json({ received: true });
}
