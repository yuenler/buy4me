import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  // Expect recipientEmail (or recipientPhone) in the request body.
  const { recipientEmail, recipientPhone } = req.body;
  const amount = 1; // Request $1

  if (!recipientEmail) {
    res.status(400).json({ error: 'Missing recipientEmail' });
    return;
  }
  
  try {
    // Get PayPal credentials from environment variables.
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    
    if (!clientId || !secret) {
      res.status(500).json({ error: 'Missing PayPal credentials' });
      return;
    }
    
    // Obtain an access token from PayPal (sandbox endpoint)
    const authResponse = await fetch("https://api.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${clientId}:${secret}`).toString("base64")
      },
      body: "grant_type=client_credentials"
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("Error obtaining access token:", errorText);
      res.status(500).json({ error: "Failed to obtain PayPal access token" });
      return;
    }
    
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    // Create a payout (using the PayPal Payouts API)
    const payoutResponse = await fetch("https://api.sandbox.paypal.com/v1/payments/payouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: Math.random().toString(36).substring(9),
          email_subject: "You have a payout request!",
          email_message: "You have received a payout request of $1!"
        },
        items: [
          {
            recipient_type: "EMAIL", // Change to "PHONE" if needed
            amount: {
              value: amount.toString(),
              currency: "USD"
            },
            note: "Please pay $1.",
            receiver: recipientEmail, // or use recipientPhone if needed
            sender_item_id: "item_1"
          }
        ]
      })
    });
    
    if (!payoutResponse.ok) {
      const errorText = await payoutResponse.text();
      console.error("Error from PayPal payout:", errorText);
      res.status(500).json({ error: "PayPal payout request failed" });
      return;
    }
    
    const payoutData = await payoutResponse.json();
    res.status(200).json({ success: true, payoutData });
  } catch (error) {
    console.error("Error in sendPayPalRequest function:", error);
    res.status(500).json({ error: "Internal server error", details: error });
  }
}
