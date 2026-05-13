export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "buyer" | "seller" | "admin";
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: "ebook" | "course" | "software" | "template" | "other";
  price: number;
  currency: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  version: string;
  seller: { fullName: string; avatarUrl?: string };
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  status: "pending" | "completed" | "refunded" | "failed";
  totalAmount: number;
  currency: string;
  paidAt?: string;
}

export interface DownloadLink {
  id: string;
  orderId: string;
  token: string;
  expiresAt: string;
  clickCount: number;
  maxClicks: number;
  revoked: boolean;
}
