import { BlockTool, SanitizerConfig, ToolboxConfig } from '@editorjs/editorjs';
import { BlockToolConstructorOptions } from '@editorjs/editorjs/types/tools';
import './index.css';
export type Media3DData = {
    caption: string;
    viewer: Viewer;
} & (ThreeJSData | ModelViewerData);
type ModelViewerData = {
    file: {
        posterUrl?: string;
        iosSrcUrl?: string;
        url: string;
    };
} & {
    viewer: 'modelviewer';
};
type ThreeJSData = {
    file: {
        url: string;
    };
} & {
    viewer: 'threejs';
};
type Viewer = 'threejs' | 'modelviewer';
export type Media3DConfig = {
    viewer: Viewer;
    viewerStyle?: Partial<CSSStyleDeclaration>;
    /**
     * allowed 3d model formats
     * @example ['glb','gltf','usdz','obj','fbx','3mf']
     * @default ['glb','gltf','usdz','obj','fbx','3mf']
     */
    formatsAllowed: string[];
    /**
     * function to upload file to server
     */
    uploadFile?(file: File): Promise<{
        url: string;
        iosSrcUrl?: string;
        posterUrl?: string;
    }>;
    /**
     * Enable caption below 3D viewer
     * @default true
     */
    enableCaption: boolean;
    /**
     * Custom loader element while uploading
     * @param file {File}
     */
    customLoaderElement?(file: File): HTMLElement;
};
export default class Editorjs360MediaBlock implements BlockTool {
    sanitize?: SanitizerConfig | undefined;
    private _data;
    private config;
    private api;
    private wrapperElement;
    private captionElement?;
    private block;
    private readOnly;
    constructor({ data, config, api, readOnly, block }: BlockToolConstructorOptions<Media3DData, Media3DConfig>);
    static get isReadOnlySupported(): boolean;
    get isInline(): boolean;
    set data(data: Media3DData);
    get data(): Media3DData;
    static get toolbox(): ToolboxConfig;
    save(block: HTMLElement): Media3DData;
    render(): HTMLElement | Promise<HTMLElement>;
    private get EditorCSS();
    private get CSS();
    validate(blockData: Media3DData): boolean;
    private handleFileReceived;
    private renderUploadButton;
    private renderLoadingElement;
    private drawCaptionElement;
    private verify3DViewer;
}
export {};
