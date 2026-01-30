// src/api/axios.ts
import axios from "axios";

const ServerAxios = axios.create({
  baseURL: "http://localhost:8000/api/v1",
});

ServerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default ServerAxios;
