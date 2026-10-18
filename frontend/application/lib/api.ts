const API_URL = process.env.NEXT_PUBLIC_API_URL;

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export default api;
