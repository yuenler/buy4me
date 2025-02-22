// src/pages/NotificationsPage.tsx
import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Request } from '../types';

const NotificationsPage: React.FC = () => {
  const user = auth.currentUser;
  if (!user) {
    return <div>Please sign in to view Notifications.</div>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [requests, setRequests] = useState<Request[]>([]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(firestore, 'requests'),
      where('buyerId', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData: Request[] = [];
      snapshot.forEach((doc) =>
        requestsData.push({ id: doc.id, ...doc.data() } as Request)
      );
      // Optional: sort requests by timestamp (most recent first)
      requestsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setRequests(requestsData);
    });

    return unsubscribe;
  }, []);

  const handlePurchased = (notificationId: string) => {
    // Call the serverless endpoint to verify the purchase and calculate the amount.
    fetch('/api/verifyPurchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionData: {}, // Replace with real Plaid transaction data
        items: requests.find((n) => n.id === notificationId)?.unboughtItems,
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

  // Group requests into pending and past (completed/canceled)
  const pendingRequests = requests.filter((request) => request.fulfillment === 'pending');
  const pastRequests = requests.filter((request) => request.fulfillment !== 'pending');

  return (
    <div className="min-h-screen p-4 mx-auto w-full max-w-lg bg-gray-100">
      <h2 className="text-center text-3xl font-bold mb-8">Notifications</h2>

      {pendingRequests.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Pending Requests</h3>
          <ul className="space-y-4">
            {pendingRequests.map((request) => (
              <li
                key={request.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
              >
                <p className="mb-2 font-medium">{request.buyerUsername}</p>
                <p className="text-gray-700">{request.text}</p>
                <button
                  onClick={() => handlePurchased(request.id!)}
                  className="mt-3 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded transition-colors duration-300"
                >
                  Mark as Purchased
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pastRequests.length > 0 && (
        <section>
          <h3 className="text-xl font-semibold mb-4">Past Requests</h3>
          <ul className="space-y-4">
            {pastRequests.map((request) => (
              <li
                key={request.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
              >
                <p className="mb-2 font-medium">{request.buyerUsername}</p>
                <p className="text-gray-700">{request.text}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Status: {request.fulfillment}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {requests.length === 0 && (
        <p className="text-center text-gray-600">No notifications found.</p>
      )}
    </div>
  );
};

export default NotificationsPage;
