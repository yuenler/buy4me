// src/components/RequestDetailModal.tsx
import React, { useState, useEffect } from 'react';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: {
    id: string;
    sender: string;
    items: string;
  };
  onConfirm: (notificationId: string, updatedItems: string) => void;
}

const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  isOpen,
  onClose,
  notification,
  onConfirm,
}) => {
  const [updatedItems, setUpdatedItems] = useState(notification.items);

  // Update local state if the notification changes.
  useEffect(() => {
    setUpdatedItems(notification.items);
  }, [notification]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Request Details</h2>
        <p className="mb-2">
          Request from <strong>{notification.sender}</strong>
        </p>
        <label htmlFor="items" className="block text-sm font-medium text-gray-700 mb-2">
          Items Purchased
        </label>
        <textarea
          id="items"
          className="w-full border rounded p-2 mb-4"
          value={updatedItems}
          onChange={(e) => setUpdatedItems(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notification.id, updatedItems)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Confirm Purchase
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;
