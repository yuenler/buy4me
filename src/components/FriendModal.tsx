// src/components/FriendModal.tsx
import React, { useState } from 'react';

interface FriendModalProps {
  friendName: string;
  onClose: () => void;
  onSendRequest: (requestText: string) => void;
}

const FriendModal: React.FC<FriendModalProps> = ({
  friendName,
  onClose,
  onSendRequest,
}) => {
  const [requestText, setRequestText] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4">Request for {friendName}</h3>
        <textarea
          placeholder="Hey could you get me a coffee from Blank Street?"
          value={requestText}
          onChange={(e) => setRequestText(e.target.value)}
          className="w-full border p-2 mb-4 rounded"
          rows={3}
        />
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button
            onClick={() => onSendRequest(requestText)}
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
