import { BlockTool, PasteEvent, ConversionConfig, PasteConfig, SanitizerConfig, ToolboxConfig, ToolConfig } from '@editorjs/editorjs';
import { BlockToolConstructorOptions, MoveEvent } from '@editorjs/editorjs/types/tools';
import { ActionConfig, Media360Config, Tool360MediaData as Media360Data } from './types';
export default class Editorjs360MediaBlock implements BlockTool {
    sanitize?: SanitizerConfig | undefined;
    private _data;
    private config;
    private api;
    private block;
    private readOnly;
    private ui;
    constructor({ data, config, api, readOnly, block }: BlockToolConstructorOptions<Media360Data, Media360Config>);
    static get isReadOnlySupported(): boolean;
    get isInline(): boolean;
    set data(data: Media360Data);
    get data(): Media360Data;
    static get toolbox(): ToolboxConfig;
    save(block: HTMLElement): Media360Data;
    render(): HTMLElement | Promise<HTMLElement>;
    private get EditorCSS();
    private get CSS();
    validate(blockData: Media360Data): boolean;
    merge?(blockData: Media360Data): void;
    onPaste?(event: PasteEvent): void;
    destroy?(): void;
    rendered?(): void;
    updated?(): void;
    removed?(): void;
    moved?(event: MoveEvent): void;
    pasteConfig?: PasteConfig | undefined;
    conversionConfig?: ConversionConfig | undefined;
    title?: string | undefined;
    prepare?(data: {
        toolName: string;
        config: ToolConfig;
    }): void | Promise<void>;
    reset?(): void | Promise<void>;
    appendCallback(): void;
    static get tunes(): Array<ActionConfig>;
    private onUpload;
    /**
     * Handle uploader errors
     * @param errorText - uploading error info
     */
    private uploadingFailed;
    /**
     * Callback fired when Block Tune is activated
     * @param tuneName - tune that has been clicked
     */
    private tuneToggled;
    /**
     * Set one tune
     * @param tuneName - {@link Tunes.tunes}
     * @param value - tune state
     */
    private setTune;
    /**
     * Show preloader and upload image file
     * @param file - file that is currently uploading (from paste)
     */
    private uploadFile;
    /**
     * Show preloader and upload image by target url
     * @param url - url pasted
     */
    private uploadUrl;
}
