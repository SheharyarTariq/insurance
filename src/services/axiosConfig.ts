import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000000000,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        return Promise.reject(error)
    }
);
export default axiosInstance;