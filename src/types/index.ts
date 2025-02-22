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
  buyerId: string | null;
  requesterId: string | null;
  items: string[] | null;
  fullPrice: number | null;
  timestamp: number | null;
  unboughtItems: string[] | null;
  fulfillment: 'pending' | 'completed' | 'canceled' | null;
}

export interface Message {
  // For messages/notifications
  id?: string;
  text: string;
  orderId: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
}
