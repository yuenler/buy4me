// api/verifyPurchase.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration as PlaidConfiguration, PlaidApi, PlaidEnvironments } from 'plaid';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plaidAccessToken, items } = req.body;
  if (!plaidAccessToken || !items) {
    return res.status(400).json({ error: 'plaidAccessToken and items are required' });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Initialize Plaid client
  const plaidClient = new PlaidApi(
    new PlaidConfiguration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV as 'sandbox' | 'development' | 'production'],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
          'PLAID-SECRET': process.env.PLAID_SECRET!,
        },
      },
    })
  );

  try {
    // Define the date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Retrieve transactions from Plaid
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: plaidAccessToken,
      start_date: startDateStr,
      end_date: endDateStr,
      options: { count: 20 },
    });
    const transactions = transactionsResponse.data.transactions;

    console.log(transactions);  

    // Construct the prompt for OpenAI
    const prompt = `
Here is a list of transactions in JSON format:
${JSON.stringify(transactions)}
The purchase request is: "${items}".
Analyze the transactions to determine if a purchase matching the request was made 
(the purchase spending amount should be greater than or equal to the expected amount).

If you see a matching transaction from that place, but the dollar amount seems unreasonably high, 
the reimbursement amount should be what you think is reasonable given the request, otherwise
the full amount should be used.
If a matching transaction is found, return a JSON object with:
{
  "purchaseMade": true,
  "fullAmount": <the dollar amount from the transaction, as recorded on Plaid>,
  "reimburseAmount": <the dollar amount from the transaction, adjusted if it seems unreasonable, otherwise should match full amount>,
  "purchaseLocation": <the place where the purchase was made, e.g. 'Star market', 'Costco'>
  "requestTextSummary": <a very short 2-3 word description of the purchase request to be used on venmo>
}
If no matching transaction is found, try your best to estimate the reimbursement amount and return:
{
  "purchaseMade": false,
  "fullAmount": 0,
  "reimburseAmount": <an estimated amount to reimburse>,
  "purchaseLocation": "",
  "requestTextSummary": <a very short 2-3 word description of the purchase request to be used on venmo>
}
Return only the JSON object in your response.
If multiple matching transactions exist, use the most recent one that satisfies the purchase request.
    `.trim();

    // Call the OpenAI API to analyze the transactions and determine the reimbursement amount
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
          { role: "system", content: "You are an expert assistant that analyzes bank transactions to verify purchases." },
          {
              role: "user",
              content: prompt,
          },
      ],
      store: true,
  });

    const aiText = completion.choices[0].message?.content;

    // get the first and last bracket in the string
    const startIndex = aiText?.indexOf('{');
    const endIndex = aiText?.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1 
      || !startIndex || !endIndex
    ) {
      return res.status(500).json({
        error: 'Invalid OpenAI response',
        details: 'Missing brackets',
        aiText,
      });
    }

    const jsonStr = aiText?.substring(startIndex, endIndex + 1);
    if (!jsonStr) {
      return res.status(500).json({
        error: 'Invalid OpenAI response',
        details: 'Missing brackets',
        aiText,
      });
    }

    if (jsonStr === '{}') {
      return res.status(200).json({
        purchaseMade: false,
        reimburseAmount: 0,
      });
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      return res.status(500).json({
        error: 'Error parsing OpenAI response',
        details: parseError,
        aiText,
      });
    }

    console.log(result);

    return res.status(200).json(result);

    // return res.status(200).json({
    //   purchaseMade: true,
    //   purchaseLocation: 'house',
    //   fullAmount: 20,
    //   reimburseAmount: 10.95,
    //   requestTextSummary: 'For doing the dishes',
    // })
  } catch (error) {
    console.error('Error in verifyPurchases endpoint:', error);
    return res.status(500).json({ error: 'Internal server error', details: error });
  }
}
