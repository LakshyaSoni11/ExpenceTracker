import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        "Content-Type": "application/json",
    },
    validateStatus: function (status) {
        // Accept both 200 and 201 as success
        return status >= 200 && status < 300;
    }
});

export default api;