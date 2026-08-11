import axios from 'axios';

// Replace with YOUR computer's local IP (from ipconfig getifaddr en0)
const API_URL = 'http://192.168.1.4:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});