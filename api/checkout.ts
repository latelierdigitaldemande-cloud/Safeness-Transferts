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

const vehicles = {
  business: { name: "Business Class", basePrice: 80 },
  van: { name: "Business Van", basePrice: 120 },
  first: { name: "First Class", basePrice: 160 },
};

const extrasList = {
  child_seat: { price: 15 },
  greeter: { price: 30 },
  extra_luggage: { price: 20 },
};

interface CheckoutRequestBody {
  serviceType: 'transfer' | 'hourly';
  durationHours: number;
  vehicle: string;
  distance: number;
  extras: string[];
  time: string;
  isReturnTrip: boolean;
  pickup: string;
  dropoff: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passengers: number;
  luggage: number;
  flightNumber: string;
  lang?: string;
  serviceCategory?: string;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      serviceType, durationHours, vehicle, distance, extras, time, isReturnTrip, pickup, dropoff,
      firstName, lastName, email, phone, passengers, luggage, flightNumber,
      lang = 'fr',
      serviceCategory
    } = req.body as CheckoutRequestBody;

    if (!vehicle || !(vehicles as any)[vehicle]) {
      return res.status(400).json({ error: "Valid vehicle type is required" });
    }

    // Calculation logic (matching App.tsx)
    const selectedVehicle = (vehicles as any)[vehicle];
    const vehicleConfig = {
      business: { hourlyPrice: 60 },
      van: { hourlyPrice: 90 },
      first: { hourlyPrice: 120 }
    };
    
    let calculatedPrice = 0;
    
    if (serviceType === 'hourly') {
      const hourlyPrice = (vehicleConfig as any)[vehicle].hourlyPrice;
      calculatedPrice = hourlyPrice * (durationHours || 2);
    } else {
      calculatedPrice = selectedVehicle.basePrice;
      // Distance pricing: base + 2€/km after 10km
      if (distance > 10) {
        calculatedPrice += (distance - 10) * 2;
      }
      
      // Double for return trip (only for transfer)
      if (isReturnTrip) {
        calculatedPrice *= 2;
      }
    }

    // Extras
    if (Array.isArray(extras)) {
      extras.forEach((extraKey: string) => {
        if ((extrasList as any)[extraKey]) {
          calculatedPrice += (extrasList as any)[extraKey].price;
        }
      });
    }

    // Night surcharge (21h - 06h)
    if (time) {
      const hour = parseInt(time.split(":")[0]);
      if (hour >= 21 || hour <= 6) {
        calculatedPrice *= 1.2;
      }
    }

    const finalAmount = Math.round(calculatedPrice);

    const stripe = getStripe();

    const isEn = lang === 'en';
    const serviceName = serviceType === 'hourly' 
      ? (isEn ? 'Hourly Disposal' : 'Mise à disposition')
      : (isEn ? 'Transfer' : 'Transfert');
      
    const productName = `${serviceName} ${selectedVehicle.name}`;
    const productDesc = serviceType === 'hourly'
      ? (isEn ? `For ${durationHours} hours from ${pickup}` : `Pendant ${durationHours} heures depuis ${pickup}`)
      : (isEn 
          ? `From ${pickup} to ${dropoff}${time ? ` - ${time}` : ""}`
          : `De ${pickup} à ${dropoff}${time ? ` - ${time}` : ""}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: finalAmount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: email,
      metadata: {
        serviceType,
        serviceCategory: serviceCategory || "Default",
        durationHours: durationHours?.toString() || "0",
        firstName,
        lastName,
        email,
        phone,
        pickup,
        dropoff,
        time,
        vehicle: selectedVehicle.name,
        passengers: passengers.toString(),
        luggage: luggage.toString(),
        flightNumber: flightNumber || "N/A",
        extras: Array.isArray(extras) ? extras.join(", ") : "None",
        isReturnTrip: isReturnTrip.toString(),
      },
      success_url: `${process.env.APP_URL || process.env.VITE_APP_URL}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || process.env.VITE_APP_URL}/?status=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de la préparation de votre paiement. Veuillez réessayer plus tard." });
  }
}
