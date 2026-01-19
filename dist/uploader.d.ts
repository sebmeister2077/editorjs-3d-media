import { Media360Config, UploadResponseFormat } from "./types";
type UploaderProps = {
    /**
     * Configuration for the uploader
     */
    config: Media360Config;
    /**
     * Handles the upload response.
     * @param {UploadResponseFormat} response - Response format expected from the backend on file uploading.
     * @returns {void}
     */
    onUpload: (response: UploadResponseFormat) => void;
    /**
     *
     * @param error : error type
     * @returns void
     */
    onError: (error: string) => void;
};
type UploadOptions = {
    onPreview: (src: string) => void;
};
export declare class Uploader {
    private config;
    private onUpload;
    private onError;
    /**
     * @param params - uploader module params
     * @param params.config - image tool config
     * @param params.onUpload - one callback for all uploading (file, url, d-n-d, pasting)
     * @param params.onError - callback for uploading errors
     */
    constructor({ config, onUpload, onError }: UploaderProps);
    /**
     * Handle clicks on the upload file button
     * Fires ajax.transport()
     * @param onPreview - callback fired when preview is ready
     */
    uploadSelectedFile({ onPreview }: UploadOptions): void;
    /**
     * Handle clicks on the upload file button
     * Fires ajax.post()
     * @param url - image source url
     */
    uploadByUrl(url: string): void;
    /**
     * Handle clicks on the upload file button
     * Fires ajax.post()
     * @param file - file pasted by drag-n-drop
     * @param onPreview - file pasted by drag-n-drop
     */
    uploadByFile(file: Blob, { onPreview }: UploadOptions): void;
}
export {};
