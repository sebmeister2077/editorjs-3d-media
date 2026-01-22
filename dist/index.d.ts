import { BlockTool, ToolboxConfig } from '@editorjs/editorjs';
import { BlockToolConstructorOptions } from '@editorjs/editorjs/types/tools';
import './index.css';
export type Media3DData<Attributes extends Record<string, any> = {}, Type extends "threejs" | "modelviewer" | undefined = undefined> = {
    caption: string;
    /**
     * Additional attributes to add to the 3D viewer element
     */
    attributes?: Attributes;
} & (Type extends undefined ? (ThreeJSData | ModelViewerData) : Type extends "modelviewer" ? ModelViewerData : Type extends "threejs" ? ThreeJSData : {});
type ModelViewerData = {
    file: FileUrl;
} & {
    viewer: 'modelviewer';
};
type ThreeJSData = {
    file: FileUrl;
    secondaryFiles?: FileUrl[];
} & {
    viewer: 'threejs';
};
type Viewer = 'threejs' | 'modelviewer';
export type Media3DConfig = Partial<Media3DLocalConfig>;
export type Media3DLocalConfig<Attributes = {}> = {
    /**
     * Preferred 3D viewer to use when pasting urls
     * This of course depends on the format being supported by the viewer
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
    uploadFile?(file: File): Promise<FileUrl & {
        viewer: Viewer;
        /**
         * Other attributes to add to the 3D viewer element
         * @example for modelviewer { posterUrl: 'path/to/poster.jpg', iosSrcUrl: 'path/to/model.usdz' }
        */
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
    /**
     * Prepare threejs import before it's used in viewer. Useful for optimization.
     * This is useful in case you dont want to use threejs at all or dont have it installed.
     * @example
     * prepareThreejsImport: true will dynamically import threejs when needed.
     * prepareThreejsImport: false will disable threejs viewer.
     * @default true
     */
    prepareThreejsImport?: boolean;
    threejsConfig?: {
        uploadSecondaryFiles(secondaryFiles: File[], type: "required" | "optional"): Promise<FileUrl[]>;
    };
};
export type FileUrl = {
    url: string;
    extension: string;
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
    constructor({ data, config, api, readOnly, block }: BlockToolConstructorOptions<Media3DData, Media3DLocalConfig>);
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
