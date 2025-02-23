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
import { Request, Friend, Profile } from '../types';
import FriendMap from '../components/FriendMap';

const Buy4MePage: React.FC = () => {
  const user = auth.currentUser;
  const userId = user?.uid || '';

  const [requests, setRequests] = useState<Request[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchRequests = async () => {
      try {
        const q = query(collection(firestore, 'requests'), where('requesterId', '==', userId));
        const snapshot = await getDocs(q);
        setRequests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Request[]);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
  }, [userId]);

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
    if (!userId) return;

    const fetchFriends = async () => {
      try {
        const userRef = doc(firestore, 'profiles', userId);
        const userSnapshot = await getDoc(userRef);
        const friendIds: string[] = userSnapshot.data()?.friends || [];
        const friendPromises = friendIds.map(async (friendId) => {
          const friendProfileDoc = await getDoc(doc(firestore, 'profiles', friendId));
          return { id: friendId, username: friendProfileDoc.data()?.username || 'Unknown' };
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
      <div className="min-h-screen flex items-center justify-center bg-[#F2E8CF] text-[#386641]">
        <h2>Please sign in first.</h2>
      </div>
    );
  }

  const handleSendRequest = async (requestText: string) => {
    if (!selectedFriend) return;
    try {
      const newRequest: Omit<Request, 'id'> = {
        buyerUsername: friends.find((f) => f.id === selectedFriend)?.username || '',
        buyerId: selectedFriend,
        requesterId: userId,
        requesterUsername: profile?.username || '',
        text: requestText,
        fullPrice: null,
        timestamp: Date.now(),
        unboughtItems: [],
        fulfillment: 'pending',
        venmoRequestSent: false,
        verificationStatus: 'idle',
        venmoAccountToRequestFrom: profile?.venmo,
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
    <div className="min-h-screen bg-[#F2E8CF] p-6 flex justify-center">
      <div className="w-full max-w-lg text-[#386641]">
        <h1 className="text-4xl font-extrabold text-center mb-8">buy4me?</h1>

        {/* 🛒 Request Section */}
        <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border-4 border-[#A7C957]">
          <h2 className="text-2xl font-semibold mb-4">Make a Request</h2>
          {friends.length === 0 ? (
            <p className="text-sm text-[#6A994E]">No friends found</p>
          ) : (
            <div className="flex flex-col space-y-4">
              <label className="font-medium" htmlFor="friendSelect">
                Select a friend:
              </label>
              <select
                id="friendSelect"
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value)}
                className="p-3 rounded border border-[#A7C957] bg-[#F2E8CF] text-[#386641]"
              >
                {friends.map((friend) => (
                  <option key={friend.id} value={friend.id}>
                    {friend.username}
                  </option>
                ))}
              </select>
              <button
                onClick={() => selectedFriend && setModalVisible(true)}
                disabled={!selectedFriend}
                className="bg-[#6A994E] hover:bg-[#386641] text-white font-semibold py-2 px-4 rounded shadow-md disabled:opacity-50"
              >
                Request
              </button>
            </div>
          )}
        </section>

        {/* 🔄 Pending Requests */}
        <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border-4 border-[#A7C957]">
          <h2 className="text-2xl font-semibold mb-2">Pending Requests</h2>
          {requests.filter((r) => r.fulfillment === 'pending').length === 0 ? (
            <p className="text-sm text-[#6A994E]">No pending requests</p>
          ) : (
            requests
              .filter((r) => r.fulfillment === 'pending')
              .map((req) => (
                <div key={req.id} className="bg-[#F2E8CF] p-4 rounded shadow-sm mt-2">
                  <p className="font-medium">{req.buyerUsername}</p>
                  <p className="text-sm">{req.text}</p>
                </div>
              ))
          )}
        </section>

        {/* 📝 Past Requests */}
        <section className="mb-8 bg-white p-6 rounded-xl shadow-lg border-4 border-[#A7C957]">
          <h2 className="text-2xl font-semibold mb-2">Past Requests</h2>
          {requests.filter((r) => r.fulfillment !== 'pending').length === 0 ? (
            <p className="text-sm text-[#6A994E]">No past requests</p>
          ) : (
            requests
              .filter((r) => r.fulfillment !== 'pending')
              .map((req) => (
                <div key={req.id} className="bg-[#F2E8CF] p-4 rounded shadow-sm mt-2">
                  <p className="font-medium">{req.buyerUsername}</p>
                  <p className="text-sm">{req.text}</p>
                </div>
              ))
          )}
        </section>
        <FriendMap></FriendMap>

        {modalVisible && selectedFriend && (
          <FriendModal
            friendName={friends.find((f) => f.id === selectedFriend)?.username || 'Unknown Friend'}
            onClose={() => setModalVisible(false)}
            onSendRequest={handleSendRequest}
          />
        )}
      </div>
    </div>
  );
};

export default Buy4MePage;
