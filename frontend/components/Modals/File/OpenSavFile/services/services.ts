import { uploadSavFile as originalUploadSavFile } from "@/services/api";

/**
 * Uploads a .sav file and returns the processed data.
 * This is a wrapper around the original API call to keep it isolated.
 */
export const processSavFile = async (formData: FormData) => {
    // Potentially, you could add more specific error handling or transformation here
    // if needed, before or after calling originalUploadSavFile.
    return await originalUploadSavFile(formData);
}; 