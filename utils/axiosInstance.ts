import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, 
});

axiosInstance.interceptors.request.use(
    (config) => {
        const apiRoute =
            config.data && config.data.apiRoute
                ? ` | apiRoute: ${config.data.apiRoute}`
                : "";

        console.log(
            `[Server-to-Django] ${config.method?.toUpperCase()} ${
                config.baseURL
            }${config.url}${apiRoute}`
        );
        return config;
    },
    (error) => {
        console.error("[Server-to-Django Error]", error);
        return Promise.reject(error);
    }
);

export default axiosInstance;
