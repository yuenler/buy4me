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
import { Profile } from "../types";

// FriendRequest interface as provided
export interface FriendRequest {
  id?: string;
  initiatorId: string;
  initiatorName: string;
  receiverId: string;
  receiverName: string;
  timestamp: number | null;
}

const AddFriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState<DocumentData[]>([]);
  // Use the FriendRequest interface for friend requests state
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  // State to store the current user's profile from Firestore
  const [currentUserProfile, setCurrentUserProfile] =
    useState<Profile | null>(null);
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
          setCurrentUserProfile(profileDoc.data() as Profile);
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
        const friendIds: string[] = currentUserProfile.friends as string[];
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
        const requests: FriendRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          initiatorId: doc.data().initiatorId || "",
          initiatorName: doc.data().initiatorName || "",
          receiverId: doc.data().receiverId || "",
          receiverName: doc.data().receiverName || "",
          timestamp: doc.data().timestamp || null,
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

    // Prevent requesting an already existing friend
    if (
      currentUserProfile &&
      currentUserProfile.friends &&
      currentUserProfile.friends.includes(friendUid)
    ) {
      alert("This user is already your friend.");
      return;
    }

    // Check if a pending friend request already exists for this user
    const existingRequest = friendRequests.find(
      (req) => req.receiverId === friendUid
    );

    if (existingRequest) {
      // Undo (cancel) the friend request
      try {
        await deleteDoc(doc(firestore, "friend_requests", existingRequest.id!));
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
    <div className="min-h-screen bg-[#F2E8CF] p-6 flex justify-center">
      <div className="w-full max-w-lg">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-[#BC4749] font-semibold hover:underline"
        >
          &larr; Back
        </button>

        {/* Page Title */}
        <h2 className="text-3xl font-bold text-center text-[#386641] mb-6">
          Add Friends
        </h2>

        {/* Existing Friends Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#6A994E] mb-4">Your Friends</h2>
          {friends.length > 0 ? (
            <ul className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
              {friends.map((friend) => (
                <li
                  key={friend.uid}
                  className="flex flex-col items-center bg-white p-3 rounded-xl shadow-md min-w-[80px]"
                >
                  {friend.picture ? (
                    <img
                      src={friend.picture}
                      alt={friend.username}
                      className="rounded-full w-12 h-12 mb-1"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-300 rounded-full mb-1">
                      <FontAwesomeIcon icon={faUser} className="text-gray-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-[#386641] text-center">
                    {friend.username}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 text-center">You have no friends yet.</p>
          )}
        </div>

        {/* Search for Friends */}
        <h2 className="text-2xl font-semibold text-[#6A994E] mb-4">Find Friends</h2>
        <input
          type="text"
          placeholder="Search by username..."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          className="w-full border border-[#A7C957] p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A7C957] bg-white text-[#386641]"
        />

        {/* Search Results */}
        <ul className="mt-4 space-y-3">
          {results.map((profile) => {
            const isSelf = profile.uid === user.uid;
            const isExistingFriend =
              currentUserProfile &&
              currentUserProfile.friends &&
              currentUserProfile.friends.includes(profile.uid);
            const isRequested = friendRequests.some(
              (req) => req.receiverId === profile.uid
            );

            return (
              <li
                key={profile.uid}
                className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
              >
                <span className="text-[#386641] font-medium">{profile.username}</span>
                {isSelf || isExistingFriend ? (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded cursor-not-allowed"
                  >
                    Request
                  </button>
                ) : (
                  <button
                    onClick={() => toggleFriendRequest(profile.uid, profile.username)}
                    className={`px-4 py-2 rounded ${
                      isRequested
                        ? "bg-gray-500 text-white cursor-not-allowed"
                        : "bg-[#6A994E] hover:bg-[#386641] text-white"
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
    </div>
  );
};

export default AddFriendsPage;
