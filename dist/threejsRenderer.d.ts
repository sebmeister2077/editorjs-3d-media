import { API } from "@editorjs/editorjs";
import { Media3DConfig } from ".";
export declare class ThreejsRenderer {
    private api;
    private config;
    constructor({ api, config }: {
        api: API;
        config: Media3DConfig;
    });
    private get CSS();
    requiresExtraAssets(format: string): boolean;
    /**
     * Some formats may need special handling or extra assets to be rendered correctly.
     * @example format: 'gltf', 'obj', 'fbx'
     * @param format
     */
    renderUploaderFormat(url: string, format: string): HTMLElement;
    renderViewerFormat(format: string, url: string, otherAssets?: any): HTMLElement;
    private getExtraAssetsForFormat;
}
