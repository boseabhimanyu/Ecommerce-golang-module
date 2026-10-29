export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  profilePic?: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  dateOfBirth?: string | null;
  twoFactorEnabled: boolean;
  isEmailVerified: boolean;
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

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AddressFormData = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
};