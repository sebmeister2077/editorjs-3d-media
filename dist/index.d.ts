import { BlockTool, ToolboxConfig } from '@editorjs/editorjs';
import { BlockToolConstructorOptions } from '@editorjs/editorjs/types/tools';
import './index.css';
export type Media3DData<Attributes = {}> = {
    caption: string;
    /**
     * 3D viewer to use
     */
    viewer: Viewer;
    /**
     * Additional attributes to add to the 3D viewer element
     */
    attributes?: Attributes;
} & (ThreeJSData | ModelViewerData);
type ModelViewerData = {
    file: {
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
export type Media3DConfig<Attributes = {}> = {
    /**
     * 3D viewer to use when pasting urls
     * @example 'modelviewer' | 'threejs'
     * @default 'modelviewer'
     */
    viewer: Viewer;
    /** Custom styles for 3D viewer element
     * @example { width: '100%', height: '400px', borderRadius: '8px' }
     */
    viewerStyle?: Partial<CSSStyleDeclaration>;
    /**
     * Allowed 3d model formats
     * @example ['glb','gltf','usdz','obj','fbx','3mf']
     * @default ['glb','gltf']
     */
    formatsAllowed: string[];
    /**
     * Function to upload file to server. Must return object with url and viewer type.
     * Optionally can return other attributes to add to the 3D viewer element.
     */
    uploadFile?(file: File): Promise<{
        url: string;
        viewer: Viewer;
        otherAttributes?: Attributes;
    }>;
    /**
     * Validate file before upload
     * @return true if valid, false or string with error message if not valid
     */
    validateFile?(file: File): boolean | string;
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
    /**
     * Automatically open file picker on first render when there is no data
     * @default true
     */
    autoOpenFilePicker?: boolean;
    /**
     * Enable download button for 3D models
     * @default false
     */
    enableDownload: boolean;
};
export default class Editorjs360MediaBlock implements BlockTool {
    private _data;
    private config;
    private api;
    private wrapperElement;
    private captionElement?;
    private block;
    private readOnly;
    private _isFirstRender;
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
    private handleFileSelected;
    private renderUploadButton;
    private renderLoadingElement;
    private drawCaptionElement;
    private drawDownloadButton;
    private verify3DViewer;
}
export {};
