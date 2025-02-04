// frontend/services/axiosInstance.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000', // modifica in base al tuo backend
  withCredentials: true
});

export default axiosInstance;
