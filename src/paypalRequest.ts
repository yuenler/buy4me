export interface PaypalRequestPayload {
  fromPaypalUsername: string;
  toPaypalUsername: string;
  amount: number;
}

export interface PaypalResponse {
  verified: boolean;
  suggestedPrice?: number;
  error?: string;
}

export const sendPaypalRequest = async (
  payload: PaypalRequestPayload
): Promise<PaypalResponse> => {
  try {
    const res = await fetch('/api/paypalRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    // Check if the response is not OK (e.g., status 400 or 500)
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Server error response:', errorData);
      return { verified: false, error: errorData.error || 'Error sending PayPal request.' };
    }
    
    // Parse the response JSON
    const data: PaypalResponse = await res.json();
    return data;
  } catch (error: any) {
    console.error('Error in sendPaypalRequest:', error);
    return { verified: false, error: error.message || 'Error sending PayPal request.' };
  }
};
