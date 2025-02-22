import { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const client = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV as 'sandbox' | 'development' | 'production'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  })
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body; // Get userId from request body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const response = await client.linkTokenCreate({
      user: { client_user_id: userId }, // Use dynamic userId
      client_name: 'buy4me?',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Error creating link token' });
  }
}
