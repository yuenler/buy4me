// src/types/index.ts

export interface Profile {
  // The user’s profile document in Firestore
  username: string;
  phoneNumber: string;
  paypal?: string;
  location?: string;
  friends?: string[]; // array of userIds who are friends
}

export interface Friend {
  // For simpler friend display
  id: string;
  username: string;
}

export interface Request {
  // The order request
  id?: string;
  buyerUsername: string;
  buyerId: string | null;
  requesterId: string | null;
  requesterUsername: string | null;
  text: string | null;
  fullPrice: number | null;
  timestamp: number | null;
  unboughtItems: string[] | null;
  fulfillment: 'pending' | 'completed' | 'canceled' | null;
}

export interface FriendRequest {
  // The friend request
  id?: string;
  initiatorId: string;
  initiatorName: string;
  receiverId: string;
  receiverName: string;
  timestamp: number | null;
}

export interface Message {
  // For messages/buy4others
  id?: string;
  text: string;
  orderId: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
}
