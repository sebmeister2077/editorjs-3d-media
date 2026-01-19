import EditorJS, { BlockTool, BlockToolConstructable, BlockToolData, PasteEvent, ConversionConfig, PasteConfig, SanitizerConfig, ToolboxConfig, ToolConfig, API, BlockAPI } from '@editorjs/editorjs'
import { BlockToolConstructorOptions, MenuConfig, MoveEvent } from '@editorjs/editorjs/types/tools';
import { ICON } from './icon';
import './index.css';

export type Media3DData = {
    caption: string;
    // stretched: boolean;
    viewer: Viewer;
} & (ThreeJSData | ModelViewerData);

type ModelViewerData = {
    file: {
        posterUrl?: string;
        iosSrcUrl?: string;
        url: string;
    }
} & { viewer: 'modelviewer' };

type ThreeJSData = {
    file: {
        url: string;
    }
} & { viewer: 'threejs' };

type Viewer = 'threejs' | 'modelviewer';

export type Media3DConfig = {
    // in which way to render it: model viewer from google, three.js based viewer, or other
    viewer: Viewer;
    viewerStyle?: Partial<CSSStyleDeclaration>;
    /**
     * allowed 3d model formats
     * @example ['glb','gltf','usdz','obj','fbx','3mf']
     * @default ['glb','gltf','usdz','obj','fbx','3mf']
     */
    formatsAllowed: string[]; // allowed 3d model formats
    /**
     * function to upload file to server
     */
    uploadFile?(file: File): Promise<{ url: string; iosSrcUrl?: string; posterUrl?: string }>;
    // any other configuration options for the 3d viewer
}


export default class Editorjs360MediaBlock implements BlockTool {
    public sanitize?: SanitizerConfig | undefined;
    private _data: Media3DData;
    private config: Media3DConfig;
    private api: API;
    private block: BlockAPI;
    private readOnly: boolean;
    constructor({ data, config, api, readOnly, block }: BlockToolConstructorOptions<Media3DData, Media3DConfig>) {
        const defaultConfig: Media3DConfig = {
            viewer: 'modelviewer',
            formatsAllowed: ['glb', 'gltf', 'usdz', 'obj', 'fbx', '3mf'],
        }
        this.config = { ...defaultConfig, ...config };
        this._data = data ?? {}
        this.api = api;
        this.readOnly = readOnly;
        this.block = block;

        this.verify3DViewer();
    }

    public static get isReadOnlySupported() {
        return true;
    }
    public get isInline() {
        return false;
    }

    public set data(data: Media3DData) {
        this._data.file = data.file ?? null;
        this._data.caption = data.caption ?? "";
        this._data.viewer = data.viewer
    }
    public get data(): Media3DData {
        return this._data;
    }

    public static get toolbox(): ToolboxConfig {
        return {
            icon: ICON,
            title: "3D Media"
        }
    }
    public save(block: HTMLElement): Media3DData {

        return this.data
    }

    public render(): HTMLElement | Promise<HTMLElement> {
        if (!this.data || !this.data.file || !this.data.file.url) {
            if (this.readOnly) {
                const noData = document.createElement('div');
                noData.textContent = this.api.i18n.t('No 3D model provided');
                return noData;
            }
            const uploadButton = document.createElement('div');
            uploadButton.classList.add(this.CSS.uploadButton);
            // uploadButton.appendChild()//icon
            uploadButton.appendChild(document.createTextNode(this.api.i18n.t('Select 3D model')));
            uploadButton.addEventListener('click', async () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.hidden = true;
                fileInput.accept = this.config.formatsAllowed.map(ext => `.${ext}`).join(',');

                fileInput.addEventListener('change', async () => {
                    const file = fileInput.files?.[0];
                    if (!file) return;
                    this.handleFileReceived(file);
                    fileInput.remove();
                });

                document.body.appendChild(fileInput);
                fileInput.click();

            });

            return uploadButton
        }
        if (this.data.viewer === 'modelviewer') {
            const element = new DOMParser().parseFromString(/*html*/ `
                <model-viewer model-viewer
                    src="${this.data.file.url}"
                    ios-src="path/to/model.usdz"
                    alt="3D model description"
                    auto-rotate
                    camera-controls
                    style="width: 100%; height: 400px;">
                    </model-viewer>`, 'text/html').body.firstChild as HTMLElement;

            Object.assign(element.style, this.config.viewerStyle);
            if (this.data.file.iosSrcUrl)
                element.setAttribute('ios-src', this.data.file.iosSrcUrl);
            if (this.data.file.posterUrl)
                element.setAttribute('poster', this.data.file.posterUrl);
            return element;
        }

        return document.createElement("div");


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
            uploadButton: "cdx-3d-media-upload-button",
            tool: "3d-media-tool"
        }
    }

    // renderSettings?(): HTMLElement | MenuConfig {
    //     // throw new Error('Method not implemented.');
    // https://github.com/editor-js/image/blob/c8236e5765294f6b6590573910a68d3826671838/src/index.ts#L226
    // }
    validate(blockData: Media3DData): boolean {
        // Block is not saved if it returns false
        return Boolean(blockData?.file?.url && blockData.file.url.trim() !== '' && blockData.viewer);
    }
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


    private handleFileReceived(file: File) {
        if (!this.config.uploadFile) {
            console.error("No uploadFile function provided in config.");
            return;
        }
        const temporaryUrl = URL.createObjectURL(file);
        this.config.uploadFile(file).then((fileData) => {
            this.data = {
                ...this.data,
                file: {
                    ...fileData
                },
                caption: this.data.caption || "",
                viewer: this.config.viewer,
            };
            // this.block.refresh();
        }).catch((err) => {
            console.error("Error uploading 3D model:", err);
        }).finally(() => {
            URL.revokeObjectURL(temporaryUrl);
        })
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



