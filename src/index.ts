import EditorJS, { BlockTool, BlockToolConstructable, BlockToolData, PasteEvent, ConversionConfig, PasteConfig, SanitizerConfig, ToolboxConfig, ToolConfig, API, BlockAPI } from '@editorjs/editorjs'
import { BlockToolConstructorOptions, FilePasteEventDetail, MenuConfig, MoveEvent, PatternPasteEventDetail } from '@editorjs/editorjs/types/tools';
import { IconGlobe } from '@codexteam/icons'
import './index.css';
import { DownloadIcon, UploadIcon, } from './icons';
import { ThreejsRenderer } from './threejsRenderer';

export type Media3DData<Attributes extends Record<string, any> = {}, Type extends "threejs" | "modelviewer" | undefined = undefined> = {
    caption: string;
    /**
     * Additional attributes to add to the 3D viewer element
     */
    attributes?: Attributes;
    secondaryFiles?: FileUrl[];
} & (Type extends undefined ? (ThreeJSData | ModelViewerData) :
    Type extends "modelviewer" ? ModelViewerData :
    Type extends "threejs" ? ThreeJSData : {})

type ModelViewerData = {
    file: FileUrl
} & { viewer: 'modelviewer' };

type ThreeJSData = {
    file: FileUrl;
} & { viewer: 'threejs' };

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
    // TODO custom handles for threejs viewer

    // threejsConfig?: {
    // }
}

export type FileUrl = {
    url: string;
    /**
     * File extension without dot
     * e.g. 'glb', 'gltf', 'usdz' , 'jpg', 'png'
     */
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
    private _filePickerTimeoutId: NodeJS.Timeout | null = null;
    private _autoOpenPickerTimeoutMs = 200;

    constructor({ data, config, api, readOnly, block }: BlockToolConstructorOptions<Media3DData, Media3DLocalConfig>) {
        const defaultConfig: Media3DLocalConfig = {
            formatsAllowed: ['glb'],
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
        this._data.secondaryFiles = data.secondaryFiles ?? [];

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
            const renderer = new ThreejsRenderer({ api: this.api, config: this.config });

            // const viewerElement = rendered.renderViewerFormat(data.file, data?.secondaryFiles ?? []);
            // Object.assign(viewerElement.style, this.config.viewerStyle);
            // this.wrapperElement.replaceChildren(viewerElement);

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

    private get main3DFileExtensions() {
        return ['glb', 'gltf', 'usdz', 'obj', 'fbx', '3mf'];
    }

    //TODO render a toggle to view or not view the model in edit mode (performance boost)
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
    public static get pasteConfig(): PasteConfig | undefined {
        return {
            files: {
                extensions: ['glb']//, 'gltf', 'usdz', 'obj', 'fbx', '3mf'],
            },
            // pattern where url ends with known 3D model
            patterns: {
                'modelviewer-url': /(https?:\/\/\S+\.(glb|gltf))/i,//|gltf|usdz|obj|fbx|3mf))/i,
                'threejs-url': /(https?:\/\/\S+\.(obj|fbx|3mf))/i,
            }
        }
    }

    // this block is rendered already before paste handling btw
    public onPaste?(event: PasteEvent): void {
        switch (event.type) {
            case 'file': {
                const { file } = (event.detail as FilePasteEventDetail);
                if (this._filePickerTimeoutId)
                    clearTimeout(this._filePickerTimeoutId);
                this.handleFilesSelected([file])
                break;
            }
            case 'pattern': {
                const { data, key } = (event.detail as PatternPasteEventDetail);
                if (key === 'modelviewer-url') {
                    const extension = data.split('.').pop() || 'glb';
                    this.data = {
                        ...this.data,
                        file: {
                            url: data,
                            extension: extension,
                        }, viewer: "modelviewer"
                    };
                    if (this._filePickerTimeoutId)
                        clearTimeout(this._filePickerTimeoutId);
                    this.render();
                    return;
                }

                // complex model urls may not work for now, because they MAY require extra files
                this.api.notifier.show({
                    message: this.api.i18n.t('Pasting complex 3D model URLs is not supported yet. Please use the file uploader.'),
                    style: 'error',
                });
                this.api.blocks.delete(this.api.blocks.getBlockIndex(this.block.id!));
                // this.data = {
                //     ...this.data,
                //     file: {
                //         url: data,
                //         extension: data.split('.').pop() || ''
                //     }, viewer: "threejs"
                // };
                if (this._filePickerTimeoutId)
                    clearTimeout(this._filePickerTimeoutId);
                this.render();
                break;
            }
        }
    }
    public destroy?(): void {
        if (this._filePickerTimeoutId)
            clearTimeout(this._filePickerTimeoutId);
    }
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

    // public conversionConfig?: ConversionConfig | undefined;

    // public title?: string | undefined;
    // public prepare?(data: { toolName: string; config: ToolConfig; }): void | Promise<void> {
    //     // throw new Error('Method not implemented.');
    // }
    // public reset?(): void | Promise<void> {
    //     // throw new Error('Method not implemented.');
    // }


    private async handleFilesSelected(files: File[]) {
        if (!this.config.uploadFiles) {
            console.error("No uploadFile function provided in config.");
            return;
        }

        const validatedFiles = files.filter(file => {
            if (this.config.validateFile) {
                const validationResult = this.config.validateFile(file);
                if (validationResult !== true) {
                    const errorMessage = typeof validationResult === 'string' ? validationResult : this.api.i18n.t('Invalid file');
                    this.api.notifier.show({
                        message: errorMessage,
                        style: 'error',
                    });
                    return false;
                }
            }
            return true;
        });
        const mainFile = validatedFiles.find(file => {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
            return this.main3DFileExtensions.includes(fileExt);
        });
        if (!mainFile) {
            this.api.notifier.show({
                message: this.api.i18n.t('No valid main 3D model file found'),
                style: 'error',
            });
            return;
        }
        const loadingElement = this.renderLoadingElement(mainFile);

        try {
            const { viewer, mainFile: mainFileUrl, secondaryFiles, otherAttributes } = await this.config.uploadFiles(mainFile, validatedFiles.filter(file => file !== mainFile));

            this.data = {
                ...this.data,
                file: {
                    url: mainFileUrl.url,
                    extension: mainFileUrl.extension
                },
                secondaryFiles: secondaryFiles,
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

    private get formatExtraAssetsMap() {
        const mapping = {
            'obj': ['mtl', 'jpg', 'png', 'jpeg'],
            'gltf': ['bin', 'jpg', 'png', 'jpeg'],
            'glb': [],
            'usdz': ['jpg', 'png', 'jpeg'],
            'fbx': ['jpg', 'png', 'jpeg'],
            '3mf': ['jpg', 'png', 'jpeg'],
            // add more formats as needed
        } as const

        return {
            ...mapping,
            // all combined formats
            "*": Array.from(new Set([...Object.values(mapping).flat(), ...Object.keys(mapping)])),
        }
    }


    //#region Drawing elements

    private renderUploadButton(autoOpenPicker: boolean = false): HTMLElement {
        const shouldBeDirectory = this.config.formatsAllowed.length > 1 || this.config.formatsAllowed[0] !== 'glb';
        const message = shouldBeDirectory ? 'Select 3D model folder' : 'Select 3D model file';

        const uploadButton = document.createElement('div');
        uploadButton.classList.add(this.CSS.uploadButton);
        uploadButton.insertAdjacentHTML('beforeend', /*html*/ UploadIcon);
        uploadButton.appendChild(document.createTextNode(this.api.i18n.t(message)));

        uploadButton.addEventListener('click', async () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.hidden = true;
            fileInput.webkitdirectory = shouldBeDirectory;

            // This caontains all extensions including extra assets for each extension
            const totalExtensionSet = new Set();
            this.config.formatsAllowed.forEach(ext => {
                const extraExtensions = this.formatExtraAssetsMap[ext as keyof typeof this.formatExtraAssetsMap] || [];
                extraExtensions.forEach(extraExt => totalExtensionSet.add(extraExt.toLowerCase()));
                totalExtensionSet.add(ext.toLowerCase())
            });

            // Accept will be ignored if webkitdirectory is set to true btw
            const accept = this.config.formatsAllowed.map(ext => '.' + ext.toLowerCase()).join(',');

            fileInput.accept = accept;

            fileInput.addEventListener('change', async (e) => {
                e.stopPropagation();
                const files = fileInput.files
                if (!files || files.length === 0) return;
                const filteredFiles = Array.from(files).filter(file => {
                    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
                    return totalExtensionSet.has(fileExt);
                });
                if (filteredFiles.length === 0) {
                    this.api.notifier.show({
                        message: this.api.i18n.t('No valid 3D model files selected'),
                        style: 'error',
                    });
                    return;
                }
                this.handleFilesSelected(filteredFiles);
                fileInput.remove();
                uploadButton.remove();
            });

            document.body.appendChild(fileInput);
            fileInput.click();

        });
        if (autoOpenPicker) {
            this._filePickerTimeoutId = setTimeout(() => {
                uploadButton.click();
            }, this._autoOpenPickerTimeoutMs);
        }

        this.wrapperElement.replaceChildren(uploadButton);
        return uploadButton;
    }

    private renderLoadingElement(file: File): HTMLElement {
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
        // switch (this.config.viewer) {
        //     case 'threejs':
        //         break;
        //     case 'modelviewer':
        //         if (customElements.get('model-viewer')) {
        //             return;
        //         }
        //         console.warn("model-viewer not found in custom elements. Possibly might not work.");
        //         break;
        //     default:
        //         console.warn(`3D viewer ${this.config.viewer} is not recognized.`);
        // }

    }

}



