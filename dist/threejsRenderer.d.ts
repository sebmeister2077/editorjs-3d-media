import { API } from '@editorjs/editorjs';
import { FileUrl, Media3DLocalConfig } from '.';
export declare class ThreejsRenderer {
    private api;
    private config;
    constructor({ api, config }: {
        api: API;
        config: Media3DLocalConfig;
    });
    private get CSS();
    renderViewerFormat(mainFile: FileUrl, secondaryFiles: FileUrl[]): HTMLElement;
}
