import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
    validateStatus: function (status) {
        // Accept both 200 and 201 as success
        return status >= 200 && status < 300;
    }
});

export default api;