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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [profile, setProfile] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);

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
        const q = query(
          friendRequestsRef,
          where("receiverId", "==", user.uid),
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
      navigate("/signin");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const acceptFriendRequest = async (requestId: string, initiatorId: string) => {
    if (!user) return;
    try {
      const userRef = doc(firestore, "profiles", user.uid);
      const initiatorRef = doc(firestore, "profiles", initiatorId);

      // Add each other as friends
      await updateDoc(userRef, {
        friends: arrayUnion(initiatorId),
      });

      await updateDoc(initiatorRef, {
        friends: arrayUnion(user.uid),
      });

      await deleteDoc(doc(firestore, "friend_requests", requestId));

      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));

      const profileDoc = await getDoc(doc(firestore, "profiles", user.uid));
      if (profileDoc.exists()) {
        setProfile(profileDoc.data());
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      alert("Failed to accept friend request");
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
            <li className={profile?.setupSteps?.addFriends ? "text-green-600" : "text-red-500"}>
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
                    onClick={() => acceptFriendRequest(req.id, req.initiatorId)}
                    className="bg-[#6A994E] hover:bg-[#386641] text-white px-4 py-2 rounded-lg shadow-md transition-colors"
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
