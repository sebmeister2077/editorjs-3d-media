import EditorJS, { BlockTool, BlockToolConstructable, BlockToolData, PasteEvent, ConversionConfig, PasteConfig, SanitizerConfig, ToolboxConfig, ToolConfig, API, BlockAPI } from '@editorjs/editorjs'
import { BlockToolConstructorOptions, MenuConfig, MoveEvent } from '@editorjs/editorjs/types/tools';
import { ICON } from './icon';
import { ActionConfig } from './types';


type Data = {
    caption: string;
    // stretched: boolean;
    file: {
        url: string;
    }
}
type Config = {

}
enum BlockState {
    Empty,
    Uploading,
    Filled,
    Error,
}
type NodeNames = "wrapper" | "image" | "caption" | "imageContainer" | "fileButton" | "loader";
export default class Editorjs360MediaBlock implements BlockTool {
    public sanitize?: SanitizerConfig | undefined;
    private _data: Data;
    private config: Config;
    private api: API;
    private block: BlockAPI;
    private readOnly: boolean;
    private nodes: Record<NodeNames, HTMLElement>
    constructor(config: BlockToolConstructorOptions<Data, Config>) {
        this.config = config.config || {};
        this._data = config.data || {};
        this.api = config.api;
        this.readOnly = config.readOnly;
        this.block = config.block;

        this.nodes = {
            caption: parseStringToEl(/*html*/`<div class="" contentEditable="${(!this.readOnly).toString()}"></div>`),
            fileButton: parseStringToEl(/*html*/`<div class=""></div>`),
            image: parseStringToEl(/*html*/`<img class="">`),
            imageContainer: parseStringToEl(/*html*/`<div class=""></div>`),
            loader: parseStringToEl(/*html*/`<div class=""></div>`),
            wrapper: parseStringToEl(/*html*/`<div class=""></div>`),
        }

        // this.nodes.caption.dataset.placeholder = this.config.captionPlaceholder;
        this.nodes.imageContainer.appendChild(this.nodes.loader);
        this.nodes.wrapper.appendChild(this.nodes.imageContainer);
        this.nodes.wrapper.appendChild(this.nodes.caption);
        this.nodes.wrapper.appendChild(this.nodes.fileButton);
    }

    public static get isReadOnlySupported() {
        return true;
    }
    public get isInline() {
        return false;
    }

    public set data(data: Data) {
        this._data = data;
    }
    public get data() {
        return this._data;
    }

    public static get toolbox(): ToolboxConfig {
        return {
            icon: ICON,
            title: "360* Media"
        }
    }
    public save(block: HTMLElement): Data {
        return this.data
    }

    public render(): HTMLElement | Promise<HTMLElement> {
        const element = new DOMParser().parseFromString(/*html*/`
            <div class="cdx-block ${this.CSS.tool} image-tool--caption image-tool--uploading">
                <div class="image-tool__image">
                    <div class="image-tool__image-preloader">
                    </div>
                </div>
                <div class="cdx-input image-tool__caption" contenteditable="true" data-placeholder="Caption">
                </div>
                <div class="cdx-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <rect width="14" height="14" x="5" y="5" stroke="currentColor" stroke-width="2" rx="4"></rect><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.13968 15.32L8.69058 11.5661C9.02934 11.2036 9.48873 11 9.96774 11C10.4467 11 10.9061 11.2036 11.2449 11.5661L15.3871 16M13.5806 14.0664L15.0132 12.533C15.3519 12.1705 15.8113 11.9668 16.2903 11.9668C16.7693 11.9668 17.2287 12.1705 17.5675 12.533L18.841 13.9634"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.7778 9.33331H13.7867"></path>
                    </svg>
                     Select an Image
                </div>
            </div>
            `, 'text/html').body.firstChild as HTMLElement
        return element;
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
            tool: "360-media-tool"
        }
    }

    // renderSettings?(): HTMLElement | MenuConfig {
    //     // throw new Error('Method not implemented.');
    // https://github.com/editor-js/image/blob/c8236e5765294f6b6590573910a68d3826671838/src/index.ts#L226
    // }
    validate(blockData: Data): boolean {
        return Boolean(blockData.file.url);
    }
    public merge?(blockData: Data): void {
        // throw new Error('Method not implemented.');
    }
    public onPaste?(event: PasteEvent): void {
        // throw new Error('Method not implemented.');
    }
    public destroy?(): void {
        // throw new Error('Method not implemented.');
    }
    public rendered?(): void {
        // throw new Error('Method not implemented.');
    }
    public updated?(): void {
        // throw new Error('Method not implemented.');
    }
    public removed?(): void {
        // throw new Error('Method not implemented.');
    }
    public moved?(event: MoveEvent): void {
        // throw new Error('Method not implemented.');
    }

    public pasteConfig?: PasteConfig | undefined;
    public conversionConfig?: ConversionConfig | undefined;

    public title?: string | undefined;
    public prepare?(data: { toolName: string; config: ToolConfig; }): void | Promise<void> {
        // throw new Error('Method not implemented.');
    }
    public reset?(): void | Promise<void> {
        // throw new Error('Method not implemented.');
    }

    // public appendCallback() {
    // }
    public static get tunes(): Array<ActionConfig> {
        return []
    }

}



function parseStringToEl(html: string): HTMLElement {
    const parser = new DOMParser();
    const el = parser.parseFromString(html, 'text/html').body.firstElementChild
    return el as HTMLElement;
}