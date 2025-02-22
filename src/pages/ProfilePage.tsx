// src/pages/ProfilePage.tsx
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
  DocumentData,
  getDoc,
} from "firebase/firestore";
import { auth, firestore } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { PlaidLink } from "react-plaid-link";
import axios from "axios";

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

  // Fetch incoming friend requests for the current user
  useEffect(() => {
    if (!user) return;
    const fetchIncomingRequests = async () => {
      try {
        const friendRequestsRef = collection(firestore, "friend_requests");
        const q = query(
          friendRequestsRef,
          where("receiverId", "==", user.uid),
          where("status", "==", "pending")
        );
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
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");
    
        const response = await axios.post("/api/createLinkToken", {
          userId: user.uid, // Send user ID in the request body
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
      navigate("/signup");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Accept a friend request
  const acceptFriendRequest = async (
    requestId: string,
    initiatorId: string
  ) => {
    if (!user) return;
    try {
      // Update the profile document to add the new friend
      await updateDoc(doc(firestore, "profiles", user.uid), {
        friends: arrayUnion(initiatorId),
      });

      // Remove the friend request document
      await deleteDoc(doc(firestore, "friend_requests", requestId));

      // Update local state
      setIncomingRequests((prev) =>
        prev.filter((req) => req.id !== requestId)
      );

      // Optionally, refetch the profile to update the friend count
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <h2>Please sign in to view your profile.</h2>
      </div>
    );
  }

  // Compute friend count based on the "friends" array in the profile (if available)
  const friendCount = profile && profile.friends ? profile.friends.length : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-center">
          {profile?.picture ? (
            <img
              src={profile.picture}
              alt="Profile"
              className="rounded-full w-24 h-24"
            />
          ) : (
            <div className="flex items-center justify-center w-24 h-24 bg-gray-200 rounded-full">
              <FontAwesomeIcon
                icon={faUser}
                size="3x"
                className="text-gray-500"
              />
            </div>
          )}
        </div>
        <h2 className="text-center text-2xl mt-4">{profile?.username}</h2>
        <p className="text-center mt-2">Friends: {friendCount}</p>
        <div className="mt-4">
          <h3 className="font-bold">Profile Setup Status:</h3>
          <ul className="list-disc ml-6">
            <li
              className={
                profile?.setupSteps?.addFriends
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
              Add Friends
            </li>
            <li
              className={
                profile?.setupSteps?.linkBank
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
              Link Bank Account
            </li>
            <li
              className={
                profile?.setupSteps?.linkPaypal
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
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
            >
              {/* @ts-ignore */}
              {(props: Parameters<PlaidLinkProps["children"]>[0]) => (
                <button
                  // @ts-ignore
                  onClick={props.open}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  {profile?.setupSteps?.linkBank ? "Bank Account Linked" : "Connect Bank Account"}
                </button>
              )}
            </PlaidLink>
          ) : (
            <button className="w-full bg-gray-300 text-white py-2 px-4 rounded" disabled>
              Loading...
            </button>
          )}

        </div>

        <button
          onClick={() => navigate("/add-friends")}
          className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Add Friends
        </button>
        <button
          onClick={handleLogout}
          className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>

        {/* Friend Requests Section */}
        <div className="mt-6">
          <h3 className="text-xl font-bold">Friend Requests</h3>
          {incomingRequests.length === 0 ? (
            <p>No friend requests</p>
          ) : (
            <ul>
              {incomingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex justify-between items-center bg-white p-4 mt-2 rounded shadow"
                >
                  <span>{req.initiatorName}</span>
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
