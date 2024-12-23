import EditorJS, { BlockTool, BlockToolConstructable, BlockToolData, PasteEvent, ConversionConfig, PasteConfig, SanitizerConfig, ToolboxConfig, ToolConfig, API, BlockAPI } from '@editorjs/editorjs'
import { BlockToolConstructorOptions, MenuConfig, MoveEvent } from '@editorjs/editorjs/types/tools';
import { ICON } from './icon';
import { ActionConfig, Media360Config, Tool360MediaData as Media360Data } from './types';
import { Ui } from './ui';




export default class Editorjs360MediaBlock implements BlockTool {
    public sanitize?: SanitizerConfig | undefined;
    private _data: Media360Data;
    private config: Media360Config;
    private api: API;
    private block: BlockAPI;
    private readOnly: boolean;
    private ui: Ui;
    constructor({ data, config, api, readOnly, block }: BlockToolConstructorOptions<Media360Data, Media360Config>) {
        this.config = config || {};
        this._data = data || {};
        this.api = api;
        this.readOnly = readOnly;
        this.block = block;


        this.ui = new Ui({
            api,
            readOnly,
            onSelectFile() {
                console.log("selected file")
            },
        })

    }

    public static get isReadOnlySupported() {
        return true;
    }
    public get isInline() {
        return false;
    }

    public set data(data: Media360Data) {

        this._data.file = data.file || { url: "" };
        this._data.caption = data.caption || "";
        this.ui.fillCaption(this._data.caption);
        if (this._data.file.url)
            this.ui.fillImage(this._data.file.url);

        // Editorjs360MediaBlock.tunes.forEach(({ name: tune }) => {
        //     const value = typeof data[tune as keyof Media360Data] !== 'undefined' ?
        //         data[tune as keyof Media360Data] === true || data[tune as keyof Media360Data] === 'true'
        //         : false;

        //     this.setTune(tune as keyof Media360Data, value);
        // })
    }
    public get data(): Media360Data {
        return this._data;
    }

    public static get toolbox(): ToolboxConfig {
        return {
            icon: ICON,
            title: "360* Media"
        }
    }
    public save(block: HTMLElement): Media360Data {
        const captionText = this.ui.nodes.caption.textContent || "";
        this._data.caption = captionText;

        return this.data
    }

    public render(): HTMLElement | Promise<HTMLElement> {
        this.ui.applyTune("caption", true);

        return this.ui.render(this.data);
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
    validate(blockData: Media360Data): boolean {
        return Boolean(blockData.file.url);
    }
    public merge?(blockData: Media360Data): void {
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

    public appendCallback(): void {
        this.ui.nodes.fileButton.click();
    }
    public static get tunes(): Array<ActionConfig> {
        return []
    }


    private onUpload(response: UploadResponseFormat): void {
        if (response.success && Boolean(response.file)) {
            this.image = response.file;
        } else {
            this.uploadingFailed('incorrect response: ' + JSON.stringify(response));
        }
    }

    /**
     * Handle uploader errors
     * @param errorText - uploading error info
     */
    private uploadingFailed(errorText: string): void {
        console.log('Image Tool: uploading failed because of', errorText);

        this.api.notifier.show({
            message: this.api.i18n.t('Couldn’t upload image. Please try another.'),
            style: 'error',
        });
        this.ui.hidePreloader();
    }

    /**
     * Callback fired when Block Tune is activated
     * @param tuneName - tune that has been clicked
     */
    private tuneToggled(tuneName: keyof ImageToolData): void {
        // inverse tune state
        this.setTune(tuneName, !(this._data[tuneName] as boolean));

        // reset caption on toggle
        if (tuneName === 'caption' && !this._data[tuneName]) {
            this._data.caption = '';
            this.ui.fillCaption('');
        }
    }

    /**
     * Set one tune
     * @param tuneName - {@link Tunes.tunes}
     * @param value - tune state
     */
    private setTune(tuneName: keyof ImageToolData, value: boolean): void {
        (this._data[tuneName] as boolean) = value;

        this.ui.applyTune(tuneName, value);
        if (tuneName === 'stretched') {
            /**
             * Wait until the API is ready
             */
            Promise.resolve().then(() => {
                this.block.stretched = value;
            })
                .catch((err) => {
                    console.error(err);
                });
        }
    }

    /**
     * Show preloader and upload image file
     * @param file - file that is currently uploading (from paste)
     */
    private uploadFile(file: Blob): void {
        this.uploader.uploadByFile(file, {
            onPreview: (src: string) => {
                this.ui.showPreloader(src);
            },
        });
    }

    /**
     * Show preloader and upload image by target url
     * @param url - url pasted
     */
    private uploadUrl(url: string): void {
        this.ui.showPreloader(url);
        this.uploader.uploadByUrl(url);
    }

}



