// src/components/FriendModal.tsx
import React, { useState } from 'react';

interface FriendModalProps {
  friendName: string;
  onClose: () => void;
  onSendRequest: (items: string, store: string) => void;
}

const FriendModal: React.FC<FriendModalProps> = ({ friendName, onClose, onSendRequest }) => {
  const [items, setItems] = useState('');
  const [store, setStore] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4">Request from {friendName}</h3>
        <input
          type="text"
          placeholder="Items to pick up"
          value={items}
          onChange={(e) => setItems(e.target.value)}
          className="w-full border p-2 mb-4 rounded"
        />
        <input
          type="text"
          placeholder="Grocery store"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="w-full border p-2 mb-4 rounded"
        />
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button
            onClick={() => onSendRequest(items, store)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendModal;
