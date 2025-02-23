import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { auth, firestore } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { PlaidLink } from "react-plaid-link";
import axios from "axios";
import { DocumentData } from "firebase/firestore";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // State for Firestore profile and friend requests
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<DocumentData[]>([]);

  // States for Plaid integration
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Fetch the current user's profile from Firestore
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
    const fetchIncomingRequests = async () => {
      try {
        const friendRequestsRef = collection(firestore, "friend_requests");
        const q = query(friendRequestsRef, where("receiverId", "==", user.uid));
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setIncomingRequests(requests);
      } catch (error) {
        console.error("Error fetching incoming friend requests:", error);
      }
    };

    fetchIncomingRequests();
  }, [user]);

  // Fetch Plaid Link Token on component mount
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("User not authenticated");

        const response = await axios.post("/api/createLinkToken", {
          userId: currentUser.uid, // Send user ID in the request body
        });

        setLinkToken(response.data.link_token);
      } catch (error) {
        console.error("Error fetching link token:", error);
      }
    };

    fetchLinkToken();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Accept a friend request
  const acceptFriendRequest = async (requestId: string, initiatorId: string) => {
    if (!user) return;
    try {
      // Update the profile document to add the new friend
      await updateDoc(doc(firestore, "profiles", user.uid), {
        friends: arrayUnion(initiatorId),
      });

      const initiatorRef = doc(firestore, "profiles", initiatorId);

      await updateDoc(initiatorRef, {
        friends: arrayUnion(user.uid),
      });

      await deleteDoc(doc(firestore, "friend_requests", requestId));

      // Update local state
      setIncomingRequests((prev) =>
        prev.filter((req) => req.id !== requestId)
      );

      const profileDoc = await getDoc(doc(firestore, "profiles", user.uid));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data());
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request");
    }
  };

  // Handler for successful bank account connection via Plaid Link
  const handleOnSuccess = async (public_token: string, metadata: any) => {
    try {
      const response = await axios.post("/api/exchangePublicToken", {
        public_token,
      });
      setAccessToken(response.data.access_token);
      // Optionally, update the user's profile to reflect that the bank account is linked.
      if (user) {
        await updateDoc(doc(firestore, "profiles", user.uid), {
          "setupSteps.linkBank": true,
        });
        // Refetch profile
        const profileDoc = await getDoc(doc(firestore, "profiles", user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data());
        }
      }
    } catch (error) {
      console.error("Error exchanging public token:", error);
    }
  };

  // Handler for when the Plaid Link flow exits (either with or without an error)
  const handleOnExit = (error: any, metadata: any) => {
    if (error) {
      console.error("Plaid Link exited with error:", error);
    } else {
      console.log("Plaid Link exited without error.", metadata);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2E8CF] text-[#386641]">
        <h2>Please sign in to view your profile.</h2>
      </div>
    );
  }

  const friendCount = profile?.friends?.length || 0;

  return (
    <div className="min-h-screen bg-[#F2E8CF] flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 border-4 border-[#A7C957]">
        <div className="flex justify-center">
          {profile?.picture ? (
            <img
              src={profile.picture}
              alt="Profile"
              className="rounded-full w-24 h-24 border-4 border-[#6A994E]"
            />
          ) : (
            <div className="flex items-center justify-center w-24 h-24 bg-[#A7C957] rounded-full">
              <FontAwesomeIcon icon={faUser} size="3x" className="text-white" />
            </div>
          )}
        </div>

        <h2 className="text-center text-2xl text-[#386641] mt-4 font-bold">
          {profile?.username}
        </h2>
        <p className="text-center text-[#6A994E] mt-2">Friends: {friendCount}</p>

        <div className="mt-4">
          <h3 className="font-bold text-[#6A994E]">Profile Setup Status:</h3>
          <ul className="list-disc ml-6 text-[#386641]">
            <li className={(profile?.friends?.length > 1) ? "text-green-600" : "text-red-500"}>
              Add Friends
            </li>
            <li className={profile?.setupSteps?.linkBank ? "text-green-600" : "text-red-500"}>
              Link Bank Account
            </li>
            <li className={profile?.setupSteps?.linkPaypal ? "text-green-600" : "text-red-500"}>
              Link PayPal
            </li>
          </ul>
        </div>

        {/* Bank Account Connection Section */}
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">Bank Account</h3>

          {linkToken ? (
            <PlaidLink
              token={linkToken}
              onSuccess={handleOnSuccess}
              onExit={handleOnExit}
            >
              {profile?.setupSteps?.linkBank ? "Bank Account Linked" : "Connect Bank Account"}
            </PlaidLink>
          ) : (
            <button className="w-full bg-gray-300 text-white py-2 px-4 rounded" disabled>
              Loading...
            </button>
          )}
        </div>

        <button
          onClick={() => navigate("/add-friends")}
          className="mt-6 w-full bg-[#6A994E] hover:bg-[#386641] text-white py-2 px-4 rounded-lg shadow-md transition-colors"
        >
          Add Friends
        </button>
        <button
          onClick={handleLogout}
          className="mt-4 w-full bg-[#BC4749] hover:bg-red-700 text-white py-2 px-4 rounded-lg shadow-md transition-colors"
        >
          Logout
        </button>

        <div className="mt-6">
          <h3 className="text-xl font-bold text-[#6A994E]">Friend Requests</h3>
          {incomingRequests.length === 0 ? (
            <p className="text-[#386641]">No friend requests</p>
          ) : (
            <ul className="space-y-4">
              {incomingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex justify-between items-center bg-white p-4 border-l-4 border-[#A7C957] rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <span className="text-[#386641]">{req.initiatorName}</span>
                  <button
                    onClick={() =>
                      acceptFriendRequest(req.id, req.initiatorId)
                    }
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
