// src/types/index.ts

export interface Profile {
  // The user’s profile document in Firestore
  username: string;
  phoneNumber: string;
  venmo?: string;
  location?: string;
  friends?: string[]; // array of userIds who are friends
  plaidAccessToken?: string;
  linkedBank?: boolean;
  linkedVenmo?: boolean;
  picture?: string;
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
  timestamp: number | null;
  unboughtItems: string[] | null;
  fulfillment: 'pending' | 'completed' | 'canceled' | null;
  fullPrice?: number | null;
  reimburseAmount?: number | null;
  purchaseLocation?: string | null;
  venmoRequestSent: boolean;
  verificationStatus: 'idle' | 'loading' | 'verified' | 'notVerified';
  venmoAccountToRequestFrom?: string | null;
  requestTextSummary?: string | null;
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
