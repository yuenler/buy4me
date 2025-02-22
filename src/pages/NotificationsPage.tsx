import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Request } from "../types";

const NotificationsPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(collection(firestore, "requests"), where("buyerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData: Request[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Request[];

      // Sort by timestamp (most recent first)
      requestsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setRequests(requestsData);
    });

    return unsubscribe;
  }, [user]);

  const handlePurchased = (notificationId: string) => {
    fetch("/api/verifyPurchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionData: {}, // Replace with real Plaid transaction data
        items: requests.find((n) => n.id === notificationId)?.unboughtItems,
        paypalUsername: "recipientUsername", // Replace with actual PayPal username
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.verified) {
          alert(`Purchase verified. Suggested PayPal amount: $${data.suggestedPrice}`);
        } else {
          alert("Purchase could not be verified.");
        }
      });
  };

  const pendingRequests = requests.filter((r) => r.fulfillment === "pending");
  const pastRequests = requests.filter((r) => r.fulfillment !== "pending");

  return (
    <div className="min-h-screen bg-[#F2E8CF] flex flex-col items-center p-4">
      <h2 className="text-center text-3xl font-bold mb-8 text-[#386641]">
        Notifications
      </h2>

      <div className="w-full max-w-lg">
        {pendingRequests.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-[#6A994E]">Pending Requests</h3>
            <ul className="space-y-4">
              {pendingRequests.map((request) => (
                <li
                  key={request.id}
                  className="bg-white p-4 rounded-xl shadow-md border-l-4 border-[#A7C957] hover:shadow-lg transition-shadow duration-300"
                >
                  <p className="mb-2 font-medium text-[#386641]">{request.buyerUsername}</p>
                  <p className="text-[#6A994E]">{request.text}</p>
                  <button
                    onClick={() => handlePurchased(request.id!)}
                    className="mt-3 bg-[#6A994E] hover:bg-[#386641] text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-300"
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
            <h3 className="text-xl font-semibold mb-4 text-[#6A994E]">Past Requests</h3>
            <ul className="space-y-4">
              {pastRequests.map((request) => (
                <li
                  key={request.id}
                  className="bg-white p-4 rounded-xl shadow-md border-l-4 border-[#BC4749] hover:shadow-lg transition-shadow duration-300"
                >
                  <p className="mb-2 font-medium text-[#386641]">{request.buyerUsername}</p>
                  <p className="text-[#6A994E]">{request.text}</p>
                  <p className="mt-2 text-sm text-[#BC4749] font-semibold">Status: {request.fulfillment}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {requests.length === 0 && (
          <p className="text-center text-[#6A994E]">No notifications found.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
