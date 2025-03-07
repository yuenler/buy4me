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
import { faUser, faCheck } from "@fortawesome/free-solid-svg-icons";
import { PlaidLink } from "react-plaid-link";
import axios from "axios";
import { FriendRequest, Profile } from "../types";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // Firestore profile & friend requests state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);

  // Plaid link token
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Venmo modal state
  const [showVenmoModal, setShowVenmoModal] = useState(false);
  const [venmoUsername, setVenmoUsername] = useState("");

  // Fetch current user's profile from Firestore
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

  // Fetch incoming friend requests
  useEffect(() => {
    if (!user) return;
    const fetchIncomingRequests = async () => {
      try {
        const friendRequestsRef = collection(firestore, "friend_requests");
        const q = query(friendRequestsRef, where("receiverId", "==", user.uid));
        const snapshot = await getDocs(q);
        const requests: FriendRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as FriendRequest[];
        setIncomingRequests(requests);
      } catch (error) {
        console.error("Error fetching incoming friend requests:", error);
      }
    };

    fetchIncomingRequests();
  }, [user]);

  // Fetch Plaid Link Token on mount
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        if (!user) throw new Error("User not authenticated");
        const response = await axios.post("/api/createLinkToken", {
          userId: user.uid,
        });
        setLinkToken(response.data.link_token);
      } catch (error) {
        console.error("Error fetching link token:", error);
      }
    };

    fetchLinkToken();
  }, [user]);

  // Logout handler (still rendered inside the main container)
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
      await updateDoc(doc(firestore, "profiles", user.uid), {
        friends: arrayUnion(initiatorId),
      });
      const initiatorRef = doc(firestore, "profiles", initiatorId);
      await updateDoc(initiatorRef, {
        friends: arrayUnion(user.uid),
      });
      await deleteDoc(doc(firestore, "friend_requests", requestId));
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));

      // Refetch profile
      const profileDoc = await getDoc(doc(firestore, "profiles", user.uid));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data() as Profile);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request");
    }
  };

  // Plaid Link success and exit handlers
  const handleOnSuccess = async (public_token: string, metadata: any) => {
    try {
      const response = await axios.post("/api/exchangePublicToken", {
        public_token,
      });
      if (user) {
        await updateDoc(doc(firestore, "profiles", user.uid), {
          linkedBank: true,
          plaidAccessToken: response.data.access_token,
        });
        const profileDoc = await getDoc(doc(firestore, "profiles", user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as Profile);
        }
      }
    } catch (error) {
      console.error("Error exchanging public token:", error);
    }
  };

  const handleOnExit = (error: any, metadata: any) => {
    if (error) {
      console.error("Plaid Link exited with error:", error);
    } else {
      console.log("Plaid Link exited without error.", metadata);
    }
  };

  // Handler for Venmo submission
  const handleVenmoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc(doc(firestore, "profiles", user.uid), {
        linkedVenmo: true,
        venmo: venmoUsername,
      });
      const profileDoc = await getDoc(doc(firestore, "profiles", user.uid));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data() as Profile);
      }
      setShowVenmoModal(false);
    } catch (error) {
      console.error("Error linking Venmo:", error);
      alert("Failed to link Venmo");
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
        {/* Logout button inside the white container */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="bg-[#BC4749] hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
        <div className="flex flex-col items-center">
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
          <h2 className="text-center text-2xl text-[#386641] mt-4 font-bold">
            {profile?.username}
          </h2>
          {/* Friend count as bold, underlined, and clickable */}
          <button
            onClick={() => navigate("/add-friends")}
            className="text-center mt-2 font-bold underline text-[#6A994E]"
          >
            {friendCount} {friendCount === 1 ? "friend" : "friends"}
          </button>
        </div>

        {/* Profile Setup Tasks */}
        <div className="mt-6">
          <h3 className="font-bold text-[#6A994E] mb-4">
            Profile Setup
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Add Friends Task */}
            <div className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-[#386641]">Add Friends</p>
                {friendCount > 0 && (
                  <div className="flex items-center text-green-600">
                    <FontAwesomeIcon icon={faCheck} />{" "}
                    <span className="ml-2">Completed</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/add-friends")}
                className="bg-[#6A994E] hover:bg-[#386641] text-white px-4 py-2 rounded w-30 text-sm ms-5"
              >
                {friendCount > 0 ? "Add More" : "Add Friends"}
              </button>
            </div>

            {/* Link Bank Account Task */}
            <div className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-[#386641]">
                  Link Bank Account
                </p>
                {profile?.linkedBank && (
                  <div className="flex items-center text-green-600">
                    <FontAwesomeIcon icon={faCheck} />{" "}
                    <span className="ml-2">Completed</span>
                  </div>
                )}
              </div>
              {linkToken ? (
                <PlaidLink
                  token={linkToken}
                  onSuccess={handleOnSuccess}
                  onExit={handleOnExit}
                >
                  <button className="bg-[#6A994E] hover:bg-[#386641] text-white px-4 py-2 rounded w-30 text-sm">
                    {profile?.linkedBank ? "Change account" : "Link Account"}
                  </button>
                </PlaidLink>
              ) : (
                <button
                  className="bg-gray-300 text-white px-4 py-2 w-30 rounded"
                  disabled
                >
                  Loading...
                </button>
              )}
            </div>

            {/* Link Venmo Task */}
            <div className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-[#386641]">Link Venmo</p>
                {profile?.linkedVenmo && (
                  <div className="flex items-center text-green-600">
                    <FontAwesomeIcon icon={faCheck} />{" "}
                    <span className="ml-2">Completed</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowVenmoModal(true)}
                className="bg-[#6A994E] hover:bg-[#386641] text-white px-4 py-2 rounded w-30 text-sm ms-5"
              >
                {profile?.linkedVenmo ? "Change" : "Link Venmo"}
              </button>
            </div>
          </div>
        </div>

        {/* Friend Requests Section */}
        <div className="mt-6">
          <h3 className="text-xl font-bold text-[#6A994E]">Friend Requests</h3>
          {incomingRequests.length === 0 ? (
            <p className="text-[#386641]">No friend requests</p>
          ) : (
            <ul className="space-y-4 pt-2">
              {incomingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex justify-between items-center bg-white p-4 border-l-4 border-[#A7C957] rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <span className="text-[#386641]">{req.initiatorName}</span>
                  <button
                    onClick={() =>
                      acceptFriendRequest(req.id ?? "", req.initiatorId)
                    }
                    className="bg-[#6A994E] hover:bg-[#386641] text-white px-4 py-2 rounded"
                  >
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Venmo Modal */}
      {showVenmoModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-xl font-bold text-[#386641] mb-4">
              {profile?.linkedVenmo ? "Change Venmo Username" : "Link Venmo"}
            </h2>
            <form onSubmit={handleVenmoSubmit}>
              <input
                type="text"
                placeholder="Enter your Venmo username"
                value={venmoUsername}
                onChange={(e) => setVenmoUsername(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mb-4"
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVenmoModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#6A994E] hover:bg-[#386641] text-white px-4 py-2 rounded"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
