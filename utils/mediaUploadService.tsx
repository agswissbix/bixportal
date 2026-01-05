import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast } from "sonner";

/**
 * Carica l'immagine su Django e restituisce l'URL pubblico
 */
export const uploadImageService = async (
    file: File
): Promise<string | null> => {
    const formData = new FormData();

    formData.append("file", file);

    formData.append("apiRoute", "upload_markdown_image");

    const toastId = toast.loading("Caricamento immagine...");

    try {
        const response = await axiosInstanceClient.post("/postApi", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        toast.dismiss(toastId);

        if (response.data?.status === "success") {
            return response.data.url;
        } else {
            throw new Error(response.data?.error || "Errore sconosciuto");
        }
    } catch (error: any) {
        toast.dismiss(toastId);
        toast.error(
            "Errore upload: " + (error.response?.data?.error || error.message)
        );
        return null;
    }
};
