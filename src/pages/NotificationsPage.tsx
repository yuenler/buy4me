import React from 'react';
import { auth } from '../firebase';

const NotificationsPage: React.FC = () => {
  const user = auth.currentUser;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2E8CF] text-[#386641]">
        <h2>Please sign in to view Notifications.</h2>
      </div>
    );
  }

  // Simulated notifications data
  const notifications = [
    { id: '1', type: 'requestReceived', items: 'Bananas, Milk', sender: 'Alice' },
    { id: '2', type: 'requestSent', items: 'Bread, Eggs', recipient: 'Bob' },
  ];

  const handlePurchased = (notificationId: string) => {
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
    <div className="min-h-screen bg-[#F2E8CF] flex flex-col items-center p-6 text-[#386641]">
      <h2 className="text-4xl font-extrabold text-center mb-8">Notifications</h2>

      <ul className="w-full max-w-lg space-y-4">
        {notifications.map((notif) => (
          <li key={notif.id} className="bg-white p-6 rounded-xl shadow-lg border-4 border-[#A7C957]">
            {notif.type === 'requestReceived' ? (
              <>
                <p className="font-medium">Request from <span className="font-bold">{notif.sender}</span> for:</p>
                <p className="text-[#6A994E] font-semibold">{notif.items}</p>
                <button
                  onClick={() => handlePurchased(notif.id)}
                  className="mt-4 bg-[#6A994E] hover:bg-[#386641] text-white font-semibold py-2 px-4 rounded shadow-md"
                >
                  Purchased
                </button>
              </>
            ) : (
              <>
                <p className="font-medium">Request sent to <span className="font-bold">{notif.recipient}</span> for:</p>
                <p className="text-[#6A994E] font-semibold">{notif.items}</p>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsPage;
