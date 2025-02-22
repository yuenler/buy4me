// src/pages/AddFriendsPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  orderBy,
  startAt,
  endAt,
  DocumentData,
  getDoc,
} from "firebase/firestore";
import { auth, firestore } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const AddFriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState<DocumentData[]>([]);
  const [friendRequests, setFriendRequests] = useState<DocumentData[]>([]);
  // State to store the current user's profile from Firestore
  const [currentUserProfile, setCurrentUserProfile] =
    useState<DocumentData | null>(null);
  // State to store the fetched friends
  const [friends, setFriends] = useState<DocumentData[]>([]);
  const user = auth.currentUser;

  // Fetch the current user's profile from Firestore so we have their username and friend list
  useEffect(() => {
    if (!user) return;
    const fetchCurrentUserProfile = async () => {
      try {
        const profileDoc = await getDoc(doc(firestore, "profiles", user.uid));
        if (profileDoc.exists()) {
          setCurrentUserProfile(profileDoc.data());
        }
      } catch (error) {
        console.error("Error fetching current user profile:", error);
      }
    };

    fetchCurrentUserProfile();
  }, [user]);

  // Once we have the current user's profile, fetch details for each friend
  useEffect(() => {
    if (!currentUserProfile || !currentUserProfile.friends) return;
    const fetchFriends = async () => {
      try {
        const friendIds: string[] = currentUserProfile.friends;
        const friendDocs = await Promise.all(
          friendIds.map((id) => getDoc(doc(firestore, "profiles", id)))
        );
        const friendData = friendDocs
          .filter((docSnap) => docSnap.exists())
          .map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() }));
        setFriends(friendData);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };
    fetchFriends();
  }, [currentUserProfile]);

  // Fetch profiles based on a partial (prefix) search
  useEffect(() => {
    if (!user) return;
    if (!queryText) {
      setResults([]);
      return;
    }

    const fetchProfiles = async () => {
      try {
        const profilesRef = collection(firestore, "profiles");
        const q = query(
          profilesRef,
          orderBy("username"),
          startAt(queryText),
          endAt(queryText + "\uf8ff")
        );
        const snapshot = await getDocs(q);
        const found = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        }));
        setResults(found);
      } catch (error) {
        console.error("Error searching profiles:", error);
      }
    };

    fetchProfiles();
  }, [queryText, user]);

  // Fetch friend requests that the current user has sent
  useEffect(() => {
    if (!user) return;
    const fetchFriendRequests = async () => {
      try {
        const friendRequestsRef = collection(firestore, "friend_requests");
        const q = query(
          friendRequestsRef,
          where("initiatorId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriendRequests(requests);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
    };

    fetchFriendRequests();
  }, [user]);

  // Toggle friend request: send a new request or cancel an existing one.
  // Accepts friendName as a parameter to include the receiver's name.
  const toggleFriendRequest = async (friendUid: string, friendName: string) => {
    if (!user) {
      alert("Please sign in first");
      return;
    }

    // Prevent friend requesting yourself
    if (friendUid === user.uid) {
      alert("You cannot friend request yourself.");
      return;
    }

    // Check if a pending friend request already exists for this user
    const existingRequest = friendRequests.find(
      (req) => req.receiverId === friendUid && req.status === "pending"
    );

    if (existingRequest) {
      // Undo (cancel) the friend request
      try {
        await deleteDoc(doc(firestore, "friend_requests", existingRequest.id));
        setFriendRequests((prev) =>
          prev.filter((req) => req.id !== existingRequest.id)
        );
      } catch (error) {
        console.error("Error cancelling friend request:", error);
        alert("Failed to cancel friend request");
      }
    } else {
      // Send a new friend request including sender and receiver names
      try {
        const initiatorName =
          currentUserProfile?.username || user.displayName || "Unknown";
        const docRef = await addDoc(collection(firestore, "friend_requests"), {
          receiverId: friendUid,
          receiverName: friendName,
          initiatorId: user.uid,
          initiatorName: initiatorName,
          status: "pending",
          timestamp: Date.now(),
        });
        setFriendRequests((prev) => [
          ...prev,
          {
            id: docRef.id,
            receiverId: friendUid,
            receiverName: friendName,
            initiatorId: user.uid,
            initiatorName: initiatorName,
            status: "pending",
            timestamp: Date.now(),
          },
        ]);
      } catch (error) {
        console.error("Error sending friend request:", error);
        alert("Failed to send friend request");
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <h2>Please sign in to add friends.</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500">
        &larr; Back
      </button>

      {/* Existing Friends Section */}

      <div className="mb-6">
        <h2 className="text-2xl mb-2">Your Friends</h2>
        {friends.length > 0 ? (
          <ul className="flex space-x-4 overflow-x-auto">
            {friends.map((friend) => (
              <li
                key={friend.uid}
                className="flex flex-col items-center bg-white p-2 rounded shadow"
              >
                {friend.picture ? (
                  <img
                    src={friend.picture}
                    alt={friend.username}
                    className="rounded-full w-12 h-12 mb-1"
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
                <span className="text-sm">{friend.username}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>You have no friends yet.</p>
        )}
      </div>

      <h2 className="text-2xl mb-4">Add Friends</h2>
      <input
        type="text"
        placeholder="Search by username..."
        value={queryText}
        onChange={(e) => setQueryText(e.target.value)}
        className="w-full border p-2 mb-4 rounded"
      />
      <ul>
        {results.map((profile) => {
          const isSelf = profile.uid === user.uid;
          const isRequested = friendRequests.some(
            (req) => req.receiverId === profile.uid && req.status === "pending"
          );
          return (
            <li
              key={profile.uid}
              className="bg-white p-4 mb-2 rounded shadow flex justify-between items-center"
            >
              <span>{profile.username}</span>
              {isSelf ? (
                <button
                  disabled
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded cursor-not-allowed"
                >
                  Request
                </button>
              ) : (
                <button
                  onClick={() =>
                    toggleFriendRequest(profile.uid, profile.username)
                  }
                  className={`px-4 py-2 rounded ${
                    isRequested
                      ? "bg-gray-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {isRequested ? "Requested" : "Request"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AddFriendsPage;
