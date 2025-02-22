// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { firestore, auth } from '../firebase';
import FriendModal from '../components/FriendModal';
import { Request, Friend } from '../types';

const HomePage: React.FC = () => {
  const user = auth.currentUser;
  const userId = user?.uid || ''; // guard in case user is not logged in

  const [requests, setRequests] = useState<Request[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!userId) return; // skip if not logged in

    const fetchRequests = async () => {
      try {
        const q = query(collection(firestore, 'requests'), where('requesterId', '==', userId));
        const snapshot = await getDocs(q);
        const fetchedRequests: Request[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Request[];
        setRequests(fetchedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
  }, [userId]);

  useEffect(() => {
    if (!userId) return; // skip if not logged in

    const fetchFriends = async () => {
      try {
        const userRef = doc(firestore, 'profiles', userId);
        const userSnapshot = await getDoc(userRef);
        const friendIds: string[] = userSnapshot.data()?.friends || [];
        const friendPromises = friendIds.map(async (friendId: string) => {
          const friendProfileDoc = await getDoc(doc(firestore, 'profiles', friendId));
          return {
            id: friendId,
            username: friendProfileDoc.data()?.username || 'Unknown',
          };
        });
        const friendList = await Promise.all(friendPromises);
        setFriends(friendList);
        if (friendList.length > 0) {
          setSelectedFriend(friendList[0].id);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-scree p-4">
        <h2>Please sign in first.</h2>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.fulfillment === 'pending');
  const pastRequests = requests.filter((r) => r.fulfillment !== 'pending');

  const handleSendRequest = async (requestText: string) => {
    if (!selectedFriend) return;
    try {
      const newRequest: Omit<Request, 'id'> = {
        buyerUsername: friends.find((f) => f.id === selectedFriend)?.username || '',
        buyerId: selectedFriend,
        requesterId: userId,
        text: requestText,
        fullPrice: null,
        timestamp: Date.now(),
        unboughtItems: [],
        fulfillment: 'pending',
      };

      const docRef = await addDoc(collection(firestore, 'requests'), newRequest);
      setRequests((prev) => [...prev, { ...newRequest, id: docRef.id }]);
      console.log('Request saved to Firestore:', newRequest);
    } catch (error) {
      console.error('Error adding request:', error);
    }
    setModalVisible(false);
  };

  return (
    <div className="min-h-screen  p-4 mx-auto w-full max-w-lg">
      <h1 className="text-3xl font-bold text-center mb-8">Home Page</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Make a Request</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-500">No friends found</p>
        ) : (
          <div className="flex flex-col space-y-4">
            <label className="font-medium" htmlFor="friendSelect">
              Select a friend:
            </label>
            <select
              id="friendSelect"
              value={selectedFriend}
              onChange={(e) => setSelectedFriend(e.target.value)}
              className="p-2 rounded border"
            >
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.username}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedFriend) setModalVisible(true);
              }}
              disabled={!selectedFriend}
              className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
            >
              Request
            </button>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-white p-4 rounded shadow">
                <p className="font-medium flex items-center">
                  <span className="mr-2">{req.buyerUsername}</span>
                  <span
                    className={`${
                      req.fulfillment === 'pending'
                        ? 'text-blue-600'
                        : req.fulfillment === 'completed'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {req.fulfillment}
                  </span>
                </p>
                <p className="text-sm">{req.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Past Requests</h2>
        {pastRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No past requests</p>
        ) : (
          <div className="space-y-4">
            {pastRequests.map((req) => (
              <div key={req.id} className="bg-white p-4 rounded shadow">
                <p className="font-medium flex items-center">
                  <span className="mr-2">{req.buyerUsername}</span>
                  <span
                    className={`${
                      req.fulfillment === 'completed'
                        ? 'text-green-600'
                        : req.fulfillment === 'canceled'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {req.fulfillment}
                  </span>
                </p>
                <p className="text-sm">{req.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalVisible && selectedFriend && (
        <FriendModal
          friendName={
            friends.find((f) => f.id === selectedFriend)?.username || 'Unknown Friend'
          }
          onClose={() => setModalVisible(false)}
          onSendRequest={handleSendRequest}
        />
      )}
    </div>
  );
};

export default HomePage;
