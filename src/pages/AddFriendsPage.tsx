// src/pages/AddFriendsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddFriendsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  // In a real app, perform a search query on your database
  const results = [
    { id: '3', name: 'Charlie' },
    { id: '4', name: 'Dana' },
  ];
  const navigate = useNavigate();

  const sendFriendRequest = (friendId: string) => {
    console.log('Sending friend request to:', friendId);
    // Update Firebase with friend request status here
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-500">
        &larr; Back
      </button>
      <h2 className="text-2xl mb-4">Add Friends</h2>
      <input
        type="text"
        placeholder="Search for friends..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border p-2 mb-4 rounded"
      />
      <ul>
        {results.map((friend) => (
          <li key={friend.id} className="bg-white p-4 mb-2 rounded shadow flex justify-between items-center">
            <span>{friend.name}</span>
            <button
              onClick={() => sendFriendRequest(friend.id)}
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
