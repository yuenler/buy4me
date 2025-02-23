import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import { collection, query, where, onSnapshot, DocumentData, getDoc, doc } from "firebase/firestore";
import { Request } from "../types";

const Buy4OthersPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(firestore, "profiles", user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

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

  const handlePurchased = async (notificationId: string) => {
    try {
      const response = await fetch("/api/verifyPurchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: requests.find((n) => n.id === notificationId)?.text,
          plaidAccessToken: profile?.plaidAccessToken,
        }),
      });

      const data = await response.json();
      console.log(data);

      if (data.verified) {
        alert(`Purchase verified. Suggested PayPal amount: $${data.reimburseAmount}`);
      } else {
        alert("Purchase could not be verified.");
      }
    } catch (error) {
      console.error("Error verifying purchase:", error);
      alert("Error verifying purchase. Please try again.");
    }
  };

  const pendingRequests = requests.filter((r) => r.fulfillment === "pending");
  const pastRequests = requests.filter((r) => r.fulfillment !== "pending");

  return (
    <div className="min-h-screen bg-[#F2E8CF] p-6 flex justify-center">
      <div className="w-full max-w-lg text-[#386641]">
        <h1 className="text-4xl font-extrabold text-center mb-8">buy4others?</h1>

        {/* 🔄 Pending Requests */}
        {pendingRequests.length > 0 && (
          <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border-l-4 border-[#A7C957]">
            <h3 className="text-2xl font-semibold mb-4 text-[#6A994E]">Pending Requests</h3>
            <ul className="space-y-4">
              {pendingRequests.map((request) => (
                <li
                  key={request.id}
                  className="bg-[#F2E8CF] p-4 rounded-lg shadow-md"
                >
                  <p className="font-medium">{request.requesterUsername}</p>
                  <p className="text-sm">{request.text}</p>
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

        {/* ✅ Past Requests */}
        {pastRequests.length > 0 && (
          <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border-l-4 border-[#BC4749]">
            <h3 className="text-2xl font-semibold mb-4 text-[#BC4749]">Past Requests</h3>
            <ul className="space-y-4">
              {pastRequests.map((request) => (
                <li
                  key={request.id}
                  className="bg-[#F2E8CF] p-4 rounded-lg shadow-md"
                >
                  <p className="font-medium">{request.buyerUsername}</p>
                  <p className="text-sm">{request.text}</p>
                  <p className="mt-2 text-sm text-[#BC4749] font-semibold">Status: {request.fulfillment}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ℹ️ No Buy4Others */}
        {requests.length === 0 && (
          <p className="text-center text-[#6A994E]">No requests yet.</p>
        )}
      </div>
    </div>
  );
};

export default Buy4OthersPage;
