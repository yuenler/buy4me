// src/pages/HomePage.tsx
import React, { useState } from 'react';
import FriendModal from '../components/FriendModal';

const HomePage: React.FC = () => {
  // In a real app, retrieve friends from Firebase
  const friends = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ];

  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleFriendClick = (friendId: string) => {
    setSelectedFriend(friendId);
    setModalVisible(true);
  };

  const handleSendRequest = (items: string, store: string) => {
    // Save the request to Firebase under the chosen friend’s notifications
    console.log('Sending request to friend:', selectedFriend, items, store);
    setModalVisible(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h2 className="text-center text-2xl mb-6">Your Friends</h2>
      <div className="grid grid-cols-2 gap-4">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="bg-white p-4 rounded shadow cursor-pointer hover:bg-blue-100"
            onClick={() => handleFriendClick(friend.id)}
          >
            {friend.name}
          </div>
        ))}
      </div>
      {modalVisible && selectedFriend && (
        <FriendModal
          friendName={friends.find((f) => f.id === selectedFriend)?.name || ''}
          onClose={() => setModalVisible(false)}
          onSendRequest={handleSendRequest}
        />
      )}
    </div>
  );
};

export default HomePage;
