export type ChatMessage = {
  id: string;
  roomId: string;
  username: string;
  content: string;
  timestamp: number;
};

export type ChatRoom = {
  id: string;
  name: string;
  createdAt: number;
  userCount: number;
};

export type User = {
  username: string;
  lastActive: number;
}; 