import { BlockTool, PasteEvent, PasteConfig, ToolboxConfig } from '@editorjs/editorjs';
import { BlockToolConstructorOptions } from '@editorjs/editorjs/types/tools';
import './index.css';
export type Media3DData<Attributes extends Record<string, any> = {}, Type extends "threejs" | "modelviewer" | undefined = undefined> = {
    caption: string;
    /**
     * Additional attributes to add to the 3D viewer element
     */
    attributes?: Attributes;
    secondaryFiles?: FileUrl[];
} & (Type extends undefined ? (ThreeJSData | ModelViewerData) : Type extends "modelviewer" ? ModelViewerData : Type extends "threejs" ? ThreeJSData : {});
type ModelViewerData = {
    file: FileUrl;
} & {
    viewer: 'modelviewer';
};
type ThreeJSData = {
    file: FileUrl;
} & {
    viewer: 'threejs';
};
type Viewer = 'threejs' | 'modelviewer';
export type Media3DConfig = Partial<Media3DLocalConfig>;
export type Media3DLocalConfig<Attributes = {}> = {
    /** Custom styles for 3D viewer element
     * @example { width: '100%', height: '400px', borderRadius: '8px' }
     */
    viewerStyle?: Partial<CSSStyleDeclaration>;
    /**
     * Allowed 3d model extensions, without dot. Their respective extra asset extensions will be automatically detected and allowed.
     * @example ['glb','gltf','usdz','obj','mtl','fbx','3mf']
     * @default ['glb']
     */
    formatsAllowed: string[];
    /**
     * Function to upload file to server. Must return object with url and viewer type.
     * Optionally can return other attributes to add to the 3D viewer element.
     */
    uploadFiles?(mainFile: File, secondaryFiles: File[]): Promise<{
        mainFile: FileUrl;
        viewer: Viewer;
        /**
         * Secondary files required for the 3D model (like .mtl for .obj, .jpgs). This is usually textures and material files.
         * Note: These files usually need to be in the same directory as the main 3D model file to work correctly. Or you'd have to adjust the paths in the 3D model file accordingly (Read doc examples).
         */
        secondaryFiles?: FileUrl[];
        /**
         * Other attributes to add to the 3D viewer element
         * modelviewer docs: https://modelviewer.dev/docs/
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
     * @param mainFile {File}
    */
    customLoaderElement?(mainFile: File): HTMLElement;
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
};
export type FileUrl = {
    url: string;
    /**
     * File extension without dot
     * e.g. 'glb', 'gltf', 'usdz' , 'jpg', 'png'
     */
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
    private _filePickerTimeoutId;
    private _autoOpenPickerTimeoutMs;
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
    private get main3DFileExtensions();
    validate(blockData: Media3DData): boolean;
    static get pasteConfig(): PasteConfig | undefined;
    onPaste?(event: PasteEvent): void;
    destroy?(): void;
    private handleFilesSelected;
    private get formatExtraAssetsMap();
    private renderUploadButton;
    private renderLoadingElement;
    private drawCaptionElement;
    private drawDownloadButton;
    private verify3DViewer;
}
export {};
