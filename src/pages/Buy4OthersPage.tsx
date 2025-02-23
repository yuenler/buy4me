import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Profile, Request } from "../types";

const Buy4OthersPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customAmountModal, setCustomAmountModal] = useState<{
    id: string;
    currentAmount: number;
    senderEmail: string;
    requestTextSummary: string;
  } | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(firestore, "profiles", user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as Profile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, "requests"),
      where("buyerId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData: Request[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Request[];
      // Sort by timestamp (most recent first)
      requestsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setRequests(requestsData);
    });
    return unsubscribe;
  }, [user]);

  // Verify the purchase and update Firestore accordingly.
  const handlePurchased = async (requestId: string) => {
    // Set verificationStatus to "loading" directly in the Request document.
    await updateDoc(doc(firestore, "requests", requestId), {
      verificationStatus: "loading",
    });
    try {
      const req = requests.find((r) => r.id === requestId);
      const response = await fetch("/api/verifyPurchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: req?.text,
          plaidAccessToken: profile?.plaidAccessToken,
        }),
      });
      const data = await response.json();
      console.log({
        fulfillment: "completed",
        fullPrice: data.fullAmount,
        reimburseAmount: data.reimburseAmount,
        purchaseLocation: data.purchaseLocation,
        verificationStatus: data.purchaseMade ? "verified" : "notVerified",
        requestTextSummary: data.requestTextSummary,
      });
      // Expected response:
      // { purchaseMade: true, purchaseLocation: "Star market", fullAmount: 20.50, reimburseAmount: 10.95 }
      await updateDoc(doc(firestore, "requests", requestId), {
        fulfillment: "completed",
        fullPrice: data.fullAmount,
        reimburseAmount: data.reimburseAmount,
        purchaseLocation: data.purchaseLocation,
        verificationStatus: data.purchaseMade ? "verified" : "notVerified",
        requestTextSummary: data.requestTextSummary,
      });
    } catch (error) {
      console.error("Error verifying purchase:", error);
      await updateDoc(doc(firestore, "requests", requestId), {
        verificationStatus: "notVerified",
      });
    }
  };

  // Send the Venmo request and update the Firestore document with the sent amount.
  const handleSendVenmoRequest = async (
    requestId: string,
    amount: number,
    venmoUsername: string,
    requestTextSummary: string
  ) => {
    try {
      // Construct the Venmo URL with the linking schema.
      const note = encodeURIComponent(requestTextSummary);
      const venmoUrl = `venmo://paycharge?txn=charge&recipients=${venmoUsername}&amount=${amount}&note=${note}`;

      // Open the Venmo URL to trigger the app.
      window.location.href = venmoUrl;

      // Optionally update the Firestore document to record that the Venmo request was "sent".
      await updateDoc(doc(firestore, "requests", requestId), {
        venmoRequestSent: amount,
      });
    } catch (error) {
      console.error("Error sending Venmo request:", error);
    }
  };

  // Called when the user sends a custom amount from the modal.
  const handleSendCustomAmount = async () => {
    if (customAmountModal) {
      await handleSendVenmoRequest(
        customAmountModal.id,
        customAmountModal.currentAmount,
        customAmountModal.senderEmail!,
        customAmountModal.requestTextSummary!
      );
      setCustomAmountModal(null);
    }
  };

  // Opens the modal for custom amount.
  const openCustomAmountModal = (
    requestId: string,
    baseAmount: number,
    senderEmail: string,
    requestTextSummary: string
  ) => {
    setCustomAmountModal({
      id: requestId,
      currentAmount: baseAmount,
      senderEmail,
      requestTextSummary,
    });
  };

  // Pending requests remain unchanged except for Venmo buttons.
  const pendingRequests = requests.filter((r) => r.fulfillment === "pending");
  // Completed requests (for sending Venmo requests) are those with fulfillment === "completed".
  const pastRequests = requests.filter((r) => r.fulfillment === "completed");

  const [locationSharedAt, setLocationSharedAt] = useState<Date | null>(null);

  const handleShareMyLocation = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("User not logged in.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await updateDoc(doc(firestore, "profiles", currentUser.uid), {
            location: { latitude, longitude },
          });
          setLocationSharedAt(new Date());
        } catch (error) {
          console.error("Error updating location:", error);
          alert("Failed to update location.");
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Failed to retrieve location.");
      }
    );
  };
  

  return (
    <div className="min-h-screen bg-[#F2E8CF] p-6 flex justify-center">
      <div className="w-full max-w-lg text-[#386641]">
        <h1 className="text-4xl font-extrabold text-center mb-6">buy4others?</h1>
        <div className="flex flex-col items-center justify-center space-y-2 mt-4">
          <button
            onClick={handleShareMyLocation}
            className="bg-[#386641] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#6A994E] transition-colors duration-300"
          >
            Share My Location
          </button>
          <p className="text-center text-xs text-[#6A994E]">
            {locationSharedAt ? `Location shared at ${locationSharedAt.toLocaleTimeString()}` : " "}
          </p>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border-l-4 border-[#A7C957]">
            <h3 className="text-2xl font-semibold mb-4 text-[#6A994E]">
              Pending Requests
            </h3>
            <ul className="space-y-4">
              {pendingRequests.map((request) => {
                // Read verificationStatus directly from the Request object (defaults to "idle")
                const status = request.verificationStatus || "idle";
                return (
                  <li
                    key={request.id}
                    className="bg-[#F2E8CF] p-4 rounded-lg shadow-md"
                  >
                    <p className="font-medium">{request.requesterUsername}</p>
                    <p className="text-sm">{request.text}</p>
                    {status === "idle" && (
                      <button
                        onClick={() => handlePurchased(request.id!)}
                        className="mt-3 bg-[#6A994E] hover:bg-[#386641] text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-300"
                      >
                        Mark as Purchased
                      </button>
                    )}
                    {status === "loading" && (
                      <button
                        disabled
                        className="mt-3 bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg"
                      >
                        pending...
                      </button>
                    )}
                    {status === "notVerified" && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-semibold">
                          We could not find your transaction from your bank account data.
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {/* Conditionally render Venmo request buttons */}
                          {request.fullPrice === request.reimburseAmount ? (
                            <button
                              onClick={() =>
                                handleSendVenmoRequest(
                                  request.id!,
                                  request.reimburseAmount!,
                                  request.venmoAccountToRequestFrom ?? "",
                                  request.requestTextSummary ?? ""
                                )
                              }
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-left"
                            >
                              <div className="text-lg font-bold">
                                Venmo request ${request.reimburseAmount}
                              </div>
                              <div className="text-xs">
                                The total cost of your transaction at{" "}
                                {request.purchaseLocation}
                              </div>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleSendVenmoRequest(
                                    request.id!,
                                    request.reimburseAmount!,
                                    request.venmoAccountToRequestFrom ?? "",
                                    request.requestTextSummary ?? ""
                                  )
                                }
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-left"
                              >
                                <div className="text-lg font-bold">
                                  Venmo request ${request.reimburseAmount}
                                </div>
                                <div className="text-xs">
                                  The estimated cost of the requested items
                                </div>
                              </button> 
                            </>
                          )}
                          <button
                            onClick={() =>
                              openCustomAmountModal(
                                request.id!,
                                request.reimburseAmount || 0,
                                request.venmoAccountToRequestFrom ?? "",
                                request.requestTextSummary ?? ""
                              )
                            }
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg text-left"
                          >
                            <div className="text-lg font-bold">
                              Venmo request custom amount
                            </div>
                            <div className="text-xs">
                              Enter a custom amount to request
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Past (Completed) Requests with Venmo Request Options */}
        {pastRequests.length > 0 && (
          <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border-l-4 border-[#BC4749]">
            <h3 className="text-2xl font-semibold mb-4 text-[#BC4749]">
              Past Requests
            </h3>
            <ul className="space-y-4">
              {pastRequests.map((request) => {
                const isVerified = request.verificationStatus === "verified";
                return (
                  <li
                    key={request.id}
                    className="bg-[#F2E8CF] p-4 rounded-lg shadow-md"
                  >
                    <p className="font-medium">{request.requesterUsername}</p>
                    <p className="text-sm">{request.text}</p>
                    <p className="mt-2 text-sm text-[#BC4749] font-semibold">
                      Status:{" "}
                      {request.fulfillment
                        ? request.fulfillment.charAt(0).toUpperCase() +
                          request.fulfillment.slice(1)
                        : "Pending"}
                    </p>
                    {request.venmoRequestSent ? (
                      <p className="text-green-600 font-semibold">
                        Venmo request for ${request.venmoRequestSent} sent!
                      </p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {!isVerified && (
                          <p className="font-semibold text-xs">
                            We could not find your transaction from your bank account data.
                          </p>
                        )}
                        <button
                          onClick={() =>
                            handleSendVenmoRequest(
                              request.id!,
                              request.reimburseAmount!,
                              request.venmoAccountToRequestFrom ?? "",
                              request.requestTextSummary ?? ""
                            )
                          }
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-left"
                        >
                          <div className="text-lg font-bold">
                            Venmo request ${request.reimburseAmount}
                          </div>
                          <div className="text-xs">
                            The estimated cost of the requested items
                          </div>
                        </button>
                        {isVerified && (
                          <button
                            onClick={() =>
                              handleSendVenmoRequest(
                                request.id!,
                                request.fullPrice!,
                                request.venmoAccountToRequestFrom ?? "",
                                request.requestTextSummary ?? ""
                              )
                            }
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-left"
                          >
                            <div className="text-lg font-bold">
                              Venmo request ${request.fullPrice}
                            </div>
                            <div className="text-xs">
                              The total cost of your transaction at{" "}
                              {request.purchaseLocation}
                            </div>
                          </button>
                        ) }
                        <button
                          onClick={() =>
                            openCustomAmountModal(
                              request.id!,
                              request.reimburseAmount || 0,
                              request.venmoAccountToRequestFrom ?? "",
                              request.requestTextSummary ?? ""
                            )
                          }
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg text-left"
                        >
                          <div className="text-lg font-bold">
                            Venmo request custom amount
                          </div>
                          <div className="text-xs">
                            Enter a custom amount to request
                          </div>
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}


        {/* No Requests */}
        {requests.length === 0 && (
          <p className="text-center text-[#6A994E]">No requests yet.</p>
        )}

        {/* Custom Amount Modal */}
        {customAmountModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg w-80">
              <h2 className="text-xl mb-4">Enter Custom Amount</h2>
              <input
                type="number"
                value={customAmountModal.currentAmount}
                onChange={(e) =>
                  setCustomAmountModal({
                    ...customAmountModal,
                    currentAmount: Number(e.target.value),
                  })
                }
                className="w-full border p-2 mb-4"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setCustomAmountModal(null)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCustomAmount}
                  className="px-4 py-2 bg-purple-500 text-white rounded"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Buy4OthersPage;
