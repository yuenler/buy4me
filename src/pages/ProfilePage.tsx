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
} from "firebase/firestore";
import { auth, firestore } from "../firebase";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // For demonstration purposes, using a static profile.
  // In a real app, fetch this data from Firestore.
  const [profile, setProfile] = useState({
    picture: "https://via.placeholder.com/150",
    friendsCount: 5,
    setupSteps: {
      addFriends: true,
      linkBank: false,
      linkPaypal: false,
    },
  });

  // State for incoming friend requests
  const [incomingRequests, setIncomingRequests] = useState<DocumentData[]>([]);

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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/signup");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Accept a friend request by updating your profile in Firestore
  // and then deleting the request from "friend_requests"
  const acceptFriendRequest = async (
    requestId: string,
    initiatorId: string
  ) => {
    if (!user) return;
    try {
      // Update the current user's profile document to add the new friend.
      // This assumes your profile document contains a "friends" array.
      await updateDoc(doc(firestore, "profiles", user.uid), {
        friends: arrayUnion(initiatorId),
      });

      // Optionally, you might want to update your local profile state here.

      // Remove the friend request from Firestore
      await deleteDoc(doc(firestore, "friend_requests", requestId));

      // Remove the accepted request from the local state
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <h2>Please sign in to view your profile.</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
        <img
          src={profile.picture}
          alt="Profile"
          className="rounded-full w-24 h-24 mx-auto"
        />
        <h2 className="text-center text-2xl mt-4">Your Profile</h2>
        <p className="text-center mt-2">Friends: {profile.friendsCount}</p>
        <div className="mt-4">
          <h3 className="font-bold">Profile Setup Status:</h3>
          <ul className="list-disc ml-6">
            <li
              className={
                profile.setupSteps.addFriends
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
              Add Friends
            </li>
            <li
              className={
                profile.setupSteps.linkBank ? "text-green-500" : "text-red-500"
              }
            >
              Link Bank Account
            </li>
            <li
              className={
                profile.setupSteps.linkPaypal
                  ? "text-green-500"
                  : "text-red-500"
              }
            >
              Link PayPal
            </li>
          </ul>
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
                  {/* Display the requester’s identifier (ideally, you would display their username) */}
                  <span>{req.initiatorName}</span>
                  <button
                    onClick={() => acceptFriendRequest(req.id, req.initiatorId)}
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
