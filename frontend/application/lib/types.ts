export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  altEmail: string;
  phone: string;
  role: string;
  profilePic?: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  dateOfBirth?: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  twoFactorEnabled: boolean;
};

export type PageVisibility = "public" | "registered";

export type Page = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  slug: string;
  visibility: PageVisibility;
  createdAt: string;
  updatedAt: string;
};

export type PagesPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PagesResponse = {
  pages: Page[];
  pagination: PagesPagination;
};