// src/pages/AddFriendsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  DocumentData,
} from 'firebase/firestore';
import { auth, firestore } from '../firebase';

const AddFriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<DocumentData[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    // If user clears the search box, clear results
    if (!queryText) {
      setResults([]);
      return;
    }

    // Example: exact match on "username" == queryText
    // For partial matching, you need more advanced queries or a 3rd-party search approach.
    const fetchProfiles = async () => {
      try {
        const q = query(
          collection(firestore, 'profiles'),
          where('username', '==', queryText)
        );
        const snapshot = await getDocs(q);
        const found = snapshot.docs.map((doc) => {
          return { uid: doc.id, ...doc.data() };
        });
        setResults(found);
      } catch (error) {
        console.error('Error searching profiles:', error);
      }
    };

    fetchProfiles();
  }, [queryText, user]);

  const sendFriendRequest = async (friendUid: string) => {
    try {
      if (!user) {
        alert('Please sign in first');
        return;
      }
      // Create a friend request doc in Firestore (top-level collection or subcollection)
      await addDoc(collection(firestore, 'friendRequests'), {
        receiverId: friendUid,
        initiatorId: user.uid,
        status: 'pending',
        timestamp: Date.now(),
      });
      alert(`Friend request sent to user with uid: ${friendUid}`);
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
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
      <h2 className="text-2xl mb-4">Add Friends</h2>
      <input
        type="text"
        placeholder="Search by exact username..."
        value={queryText}
        onChange={(e) => setQueryText(e.target.value)}
        className="w-full border p-2 mb-4 rounded"
      />
      <ul>
        {results.map((profile) => (
          <li
            key={profile.uid}
            className="bg-white p-4 mb-2 rounded shadow flex justify-between items-center"
          >
            <span>{profile.username}</span>
            <button
              onClick={() => sendFriendRequest(profile.uid)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Request
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddFriendsPage;
