// src/pages/NotificationsPage.tsx
import React from 'react';
import { auth } from '../firebase';

const NotificationsPage: React.FC = () => {
  const user = auth.currentUser;
  if (!user) {
    return <div>Please sign in to view Notifications.</div>;
  }

  // In a real app, fetch notifications from Firebase.
  const notifications = [
    { id: '1', type: 'requestReceived', items: 'Bananas, Milk', sender: 'Alice' },
    { id: '2', type: 'requestSent', items: 'Bread, Eggs', recipient: 'Bob' },
  ];

  const handlePurchased = (notificationId: string) => {
    // Call the serverless endpoint to verify the purchase and calculate amount.
    fetch('/api/verifyPurchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionData: {}, // Replace with real Plaid transaction data
        items: notifications.find((n) => n.id === notificationId)?.items,
        paypalUsername: 'recipientUsername', // Replace with actual PayPal username from user data
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.verified) {
          alert(`Purchase verified. Suggested PayPal amount: $${data.suggestedPrice}`);
        } else {
          alert('Purchase could not be verified.');
        }
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-center text-2xl mb-6">Notifications</h2>
      <ul className="space-y-4">
        {notifications.map((notif) => (
          <li key={notif.id} className="bg-white p-4 rounded shadow">
            {notif.type === 'requestReceived' ? (
              <>
                <p>
                  Request from {notif.sender} for: {notif.items}
                </p>
                <button
                  onClick={() => handlePurchased(notif.id)}
                  className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
                >
                  Purchased
                </button>
              </>
            ) : (
              <p>
                Request sent to {notif.recipient} for: {notif.items}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsPage;
