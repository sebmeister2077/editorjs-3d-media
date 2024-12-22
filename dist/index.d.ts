import { BlockTool, PasteEvent, ConversionConfig, PasteConfig, SanitizerConfig, ToolboxConfig, ToolConfig } from '@editorjs/editorjs';
import { BlockToolConstructorOptions, MoveEvent } from '@editorjs/editorjs/types/tools';
import { ActionConfig } from './types';
type Data = {
    caption: string;
    file: {
        url: string;
    };
};
type Config = {};
export default class Editorjs360MediaBlock implements BlockTool {
    sanitize?: SanitizerConfig | undefined;
    private _data;
    private config;
    private api;
    private block;
    private readOnly;
    private nodes;
    constructor(config: BlockToolConstructorOptions<Data, Config>);
    static get isReadOnlySupported(): boolean;
    get isInline(): boolean;
    set data(data: Data);
    get data(): Data;
    static get toolbox(): ToolboxConfig;
    save(block: HTMLElement): Data;
    render(): HTMLElement | Promise<HTMLElement>;
    private get EditorCSS();
    private get CSS();
    validate(blockData: Data): boolean;
    merge?(blockData: Data): void;
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
    static get tunes(): Array<ActionConfig>;
}
export {};
