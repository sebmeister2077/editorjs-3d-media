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
    requiresExtraAssets(format: string, secondaryFileExtensions: string[]): {
        required: boolean;
        optional: boolean;
    } | boolean;
    /**
     * Some formats may need special handling or extra assets to be rendered correctly.
     * @example format: 'gltf', 'obj', 'fbx'
     * @param format
     */
    renderUploaderFormat(url: string, format: string, extraFiles: FileUrl[], addExtraFiles: (files: File[], type: "required" | "optional") => Promise<void>, confirmIgnoreOptional: () => void): HTMLElement;
    renderViewerFormat(mainFile: FileUrl, secondaryFiles: FileUrl[]): HTMLElement;
    private getExtraAssetsForFormat;
    private renderShortenedExtension;
}
