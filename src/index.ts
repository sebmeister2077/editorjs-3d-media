import EditorJS, { BlockTool, BlockToolConstructable, BlockToolData, PasteEvent, ConversionConfig, PasteConfig, SanitizerConfig, ToolboxConfig, ToolConfig, API, BlockAPI } from '@editorjs/editorjs'
import { BlockToolConstructorOptions, MenuConfig, MoveEvent } from '@editorjs/editorjs/types/tools';
import { IconGlobe } from '@codexteam/icons'
import './index.css';
import { DownloadIcon, UploadIcon, } from './icons';
import { ThreejsRenderer } from './threejsRenderer';

export type Media3DData<Attributes = {}, Type extends "threejs" | "modelviewer" | undefined = undefined> = {
    caption: string;
    /**
     * Additional attributes to add to the 3D viewer element
     */
    attributes?: Attributes;
} & (Type extends undefined ? (ThreeJSData | ModelViewerData) :
    Type extends "modelviewer" ? ModelViewerData :
    Type extends "threejs" ? ThreeJSData : {})

type ModelViewerData = {
    file: FileUrl
} & { viewer: 'modelviewer' };

type ThreeJSData = {
    file: FileUrl;
    secondaryFiles?: FileUrl[];
} & { viewer: 'threejs' };

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
    formatsAllowed: string[]; // allowed 3d model formats
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
        otherAttributes?: Attributes
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
    // TODO custom handles for threejs viewer

    threejsConfig?: {
        uploadSecondaryFiles(secondaryFiles: File[], type: "required" | "optional"): Promise<FileUrl[]>;
    }
}

export type FileUrl = {
    url: string;
    //TODO remove this because it is temporary, i am using URL.createObjectURL in dev mode
    extension: string;
}

export default class Editorjs360MediaBlock implements BlockTool {
    private _data: Media3DData;
    private config: Media3DLocalConfig;
    private api: API;
    private wrapperElement: HTMLElement;
    private captionElement?: HTMLElement;
    private block: BlockAPI;
    private readOnly: boolean;
    private _isFirstRender: boolean = true;

    constructor({ data, config, api, readOnly, block }: BlockToolConstructorOptions<Media3DData, Media3DLocalConfig>) {
        const defaultConfig: Media3DLocalConfig = {
            viewer: 'modelviewer',
            formatsAllowed: ['glb', 'gltf'],
            enableCaption: true,
            autoOpenFilePicker: true,
            enableDownload: false,
        }
        this.config = { ...defaultConfig, ...config };
        this._data = data ?? {}
        this.api = api;
        this.readOnly = readOnly;
        this.block = block;

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.classList.add(this.CSS.wrapper);
        if (this.block.id) {
            this.verify3DViewer();
        }
    }

    public static get isReadOnlySupported() {
        return true;
    }

    public get isInline() {
        return false;
    }


    public set data(data: Media3DData) {
        const hasAnythingChanged = JSON.stringify(this._data) !== JSON.stringify(data);
        this._data.file = data.file ?? null;
        this._data.caption = data.caption ?? "";
        this._data.viewer = data.viewer;
        this._data.attributes = data.attributes ?? {};
        if (data.viewer === 'threejs') {
            (this._data as Media3DData<{}, "threejs">).secondaryFiles = data.secondaryFiles ?? [];
        }


        if (!hasAnythingChanged) return;
        if (this.captionElement && this.captionElement.innerText !== this._data.caption)
            this.captionElement.innerText = this._data.caption;
        this.block.dispatchChange();
    }

    public get data(): Media3DData {
        return this._data;
    }

    public static get toolbox(): ToolboxConfig {
        return {
            icon: IconGlobe,
            title: "3D Media"
        }
    }
    public save(block: HTMLElement): Media3DData {
        return this.data
    }

    public render(): HTMLElement | Promise<HTMLElement> {
        console.log("🚀 ~ Editorjs360MediaBlock.render ~ this.data:", this.data)
        const autoOpenPicker = this.config.autoOpenFilePicker && this._isFirstRender && !this.readOnly;
        this._isFirstRender = false;
        const data = this.data;
        if (!data || !data.file || !data.file.url) {
            if (this.readOnly) {
                const noData = document.createTextNode(this.api.i18n.t('No 3D model provided'));
                this.wrapperElement.replaceChildren(noData);
                return this.wrapperElement;
            }
            this.renderUploadButton(autoOpenPicker);
            return this.wrapperElement;
        }

        const downloadButton = this.drawDownloadButton();

        if (data.viewer === 'modelviewer') {
            const viewerElement = new DOMParser().parseFromString(/*html*/ `
                <model-viewer model-viewer
                    src="${data.file.url}"
                    alt="${this.api.i18n.t('A 3D model')}"
                    auto-rotate
                    camera-controls
                    style="width: 100%; height: 400px;">
                    </model-viewer>`, 'text/html').body.firstChild as HTMLElement;

            Object.assign(viewerElement.style, this.config.viewerStyle);
            //  for example posterUrl and iosSrcUrl
            Object.keys(data.attributes || {}).forEach(key => {
                viewerElement.setAttribute(key, (data.attributes as any)[key]);
            });
            viewerElement.addEventListener("error", (e) => {
                console.error("Error rendering 3D model in model-viewer:", e);
                this.api.notifier.show({
                    message: this.api.i18n.t('Error rendering 3D model'),
                    style: 'error',
                });
                viewerElement.replaceWith(document.createTextNode(this.api.i18n.t('Error rendering 3D model')));
            });

            const childrenToAppend = [viewerElement];

            if (this.config.enableCaption) {
                this.captionElement = this.drawCaptionElement();
                childrenToAppend.push(this.captionElement);
            }
            this.wrapperElement.replaceChildren(...childrenToAppend);
            if (downloadButton) {
                this.wrapperElement.appendChild(downloadButton);
            }
            return this.wrapperElement;
        }

        if (data.viewer === 'threejs') {
            const rendered = new ThreejsRenderer({ api: this.api, config: this.config });
            const format = data.file.extension
            const requiresExtraAssets = rendered.requiresExtraAssets(format);
            if (requiresExtraAssets) {

                const threejsUploadElement = rendered.renderUploaderFormat(data.file.url, format, data.secondaryFiles ?? [], (files, type) => {
                    if (!this.config.threejsConfig?.uploadSecondaryFiles) {
                        console.error("No uploadSecondaryFiles function provided in threejsConfig.");
                        return;
                    }
                    this.config.threejsConfig?.uploadSecondaryFiles(files, type).then(urls => {
                        this.data = {
                            ...this.data,
                            viewer: 'threejs',
                            secondaryFiles: [...(data.secondaryFiles ?? []), ...urls].flat(),
                        };
                        this.render();
                    })
                });
                this.wrapperElement.replaceChildren(threejsUploadElement);
            }
            else {
                const viewerElement = rendered.renderViewerFormat(format, data.file.url, data.secondaryFiles ?? []);
                Object.assign(viewerElement.style, this.config.viewerStyle);
                this.wrapperElement.replaceChildren(viewerElement);
            }

            // const notSupported = document.createTextNode(this.api.i18n.t('ThreeJS viewer is not supported yet.'));
            // this.wrapperElement.replaceChildren(notSupported);
            return this.wrapperElement;
        }

        return this.wrapperElement;

    }

    private get EditorCSS() {
        return {
            block: "ce-block",
            content: "ce-block__content",
            redactor: "codex-editor__redactor",
        }
    }

    private get CSS() {
        return {
            wrapper: "cdx-3d-media",
            uploadButton: "cdx-3d-media-upload-button",
            loader: "cdx-3d-media-loader",
            caption: "cdx-3d-media-caption",
            download: "cdx-3d-media-download",
        }
    }

    // renderSettings?(): HTMLElement | MenuConfig {
    //     return [{
    //         children: [],
    //         element: document.createElement('div'),
    //         title: '3D Media Settings',
    //         name: '3dMediaSettings'
    //     }] as MenuConfig
    //     // throw new Error('Method not implemented.');
    // }
    validate(blockData: Media3DData): boolean {
        // Block is not saved if it returns false
        return Boolean(blockData?.file?.url && blockData.file.url.trim() !== '' && blockData.viewer);
    }

    // public get sanitize(): SanitizerConfig | undefined {
    //     return undefined;
    // }

    // public merge?(blockData: Media3DData): void {
    //     // throw new Error('Method not implemented.');
    // }
    // public onPaste?(event: PasteEvent): void {
    //     // throw new Error('Method not implemented.');
    // }
    // public destroy?(): void {
    //     // throw new Error('Method not implemented.');
    // }
    // public rendered?(): void {
    //     // throw new Error('Method not implemented.');
    // }
    // public updated?(): void {
    //     // throw new Error('Method not implemented.');
    // }
    // public removed?(): void {
    //     // throw new Error('Method not implemented.');
    // }
    // public moved?(event: MoveEvent): void {
    //     // throw new Error('Method not implemented.');
    // }

    // public pasteConfig?: PasteConfig | undefined;
    // public conversionConfig?: ConversionConfig | undefined;

    // public title?: string | undefined;
    // public prepare?(data: { toolName: string; config: ToolConfig; }): void | Promise<void> {
    //     // throw new Error('Method not implemented.');
    // }
    // public reset?(): void | Promise<void> {
    //     // throw new Error('Method not implemented.');
    // }


    private async handleFileSelected(file: File) {
        if (!this.config.uploadFile) {
            console.error("No uploadFile function provided in config.");
            return;
        }
        if (this.config.validateFile) {
            const validationResult = this.config.validateFile(file);
            if (validationResult !== true) {
                const errorMessage = typeof validationResult === 'string' ? validationResult : this.api.i18n.t('Invalid file');
                this.api.notifier.show({
                    message: errorMessage,
                    style: 'error',
                });
                return;
            }
        }
        const loadingElement = this.renderLoadingElement(file);

        try {
            const { viewer, url, extension, ...otherAttributes } = await this.config.uploadFile(file);
            this.data = {
                ...this.data,
                file: {
                    url,
                    extension
                },
                caption: this.data.caption || "",
                viewer: viewer,
                attributes: otherAttributes || {},
            };
        }
        catch (err) {
            this.api.notifier.show({
                message: this.api.i18n.t('Error uploading 3D model'),
                style: 'error',
            })
            console.error("Error uploading 3D model:", err);

        }
        finally {
            this.render();
        }
    }


    //#region Drawing elements

    private renderUploadButton(autoOpenPicker: boolean = false) {
        const uploadButton = document.createElement('div');
        uploadButton.classList.add(this.CSS.uploadButton);
        uploadButton.insertAdjacentHTML('beforeend', /*html*/ UploadIcon);
        uploadButton.appendChild(document.createTextNode(this.api.i18n.t('Select 3D model')));
        uploadButton.addEventListener('click', async () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.hidden = true;
            fileInput.accept = this.config.formatsAllowed.map(ext => `.${ext}`).join(',');

            fileInput.addEventListener('change', async (e) => {
                e.stopPropagation();
                const file = fileInput.files?.[0];
                if (!file) return;
                this.handleFileSelected(file);
                fileInput.remove();
                uploadButton.remove();
            });

            document.body.appendChild(fileInput);
            fileInput.click();

        });
        if (autoOpenPicker) {
            queueMicrotask(() => {
                uploadButton.click();
            });
        }

        this.wrapperElement.replaceChildren(uploadButton);
    }

    private renderLoadingElement(file: File) {
        if (this.config.customLoaderElement) {
            const customLoader = this.config.customLoaderElement(file);
            this.wrapperElement.replaceChildren(customLoader);
            return customLoader;
        }

        const loadingElement = document.createElement('div');
        loadingElement.classList.add(this.CSS.loader);

        this.wrapperElement.replaceChildren(loadingElement);

        return loadingElement;
    }

    private drawCaptionElement() {
        const captionElement = document.createElement('div');
        captionElement.contentEditable = String(!this.readOnly);
        captionElement.classList.add(this.CSS.caption);
        captionElement.contentEditable = String(!this.readOnly);
        captionElement.innerText = this.data.caption || "";
        captionElement.addEventListener('input', (e) => {
            e.stopPropagation();
            this.data = {
                ...this.data,
                caption: captionElement.innerText,
            };
        });
        captionElement.dataset.placeholder = this.api.i18n.t("Caption");


        return captionElement;
    }

    private drawDownloadButton() {
        if (!this.config.enableDownload || !this.readOnly)
            return null;

        const downloadButton = document.createElement('a');
        downloadButton.href = this.data.file.url;
        downloadButton.classList.add(this.CSS.download);
        downloadButton.title = this.api.i18n.t('Download 3D model');
        downloadButton.setAttribute('download', '');
        downloadButton.insertAdjacentHTML('beforeend', DownloadIcon);

        return downloadButton;
    }


    private verify3DViewer() {
        switch (this.config.viewer) {
            case 'threejs':
                break;
            case 'modelviewer':
                if (customElements.get('model-viewer')) {
                    return;
                }
                console.warn("model-viewer not found in custom elements. Possibly might not work.");
                break;
            default:
                console.warn(`3D viewer ${this.config.viewer} is not recognized.`);
        }

    }

}



