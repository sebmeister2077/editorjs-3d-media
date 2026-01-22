import { API } from "@editorjs/editorjs";
import { FileUrl, Media3DLocalConfig } from ".";
export declare class ThreejsRenderer {
    private api;
    private config;
    constructor({ api, config }: {
        api: API;
        config: Media3DLocalConfig;
    });
    private get CSS();
    requiresExtraAssets(format: string): boolean;
    /**
     * Some formats may need special handling or extra assets to be rendered correctly.
     * @example format: 'gltf', 'obj', 'fbx'
     * @param format
     */
    renderUploaderFormat(url: string, format: string, extraFiles: FileUrl[], addExtraFiles: (files: File[], type: "required" | "optional") => void): HTMLElement;
    renderViewerFormat(format: string, url: string, otherAssets?: FileUrl[]): HTMLElement;
    private getExtraAssetsForFormat;
    private renderShortenedExtension;
}
