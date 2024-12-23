import { API } from "@editorjs/editorjs";
import { Tool360MediaData } from "./types";

type NodeNames = "wrapper" | "caption" | "imageContainer" | "fileButton" | "loader";
type ConstructorProps = {
    api: API;
    readOnly: boolean;
}
enum BlockState {
    Empty,
    Uploading,
    Filled,
    Error,
}
export class Ui {
    private nodes: Record<NodeNames, HTMLElement> & { media: null | HTMLImageElement | HTMLVideoElement }

    private api: API;
    private readOnly: boolean;
    constructor({ api, readOnly }: ConstructorProps) {
        this.api = api
        this.readOnly = readOnly;

        this.nodes = {
            caption: parseStringToEl(/*html*/`<div class="" contentEditable="${(!this.readOnly).toString()}"></div>`),
            fileButton: parseStringToEl(/*html*/`<div class=""></div>`),
            media: null,
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

    public render(toolData: Tool360MediaData): HTMLElement {
        if (!toolData.file || Object.keys(toolData.file).length == 0) {
            this.toggleStatus(BlockState.Empty)
        }
        else {
            this.toggleStatus(BlockState.Uploading)
        }


        return this.nodes.wrapper;
    }

    public applyTune(tuneName: string, status: boolean): void {
        this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${tuneName}`, status);
    }

    public showPreloader(src: string): void {
        this.nodes.loader.style.backgroundImage = `url(${src})`;

        this.toggleStatus(BlockState.Uploading);
    }

    /**
     * Hide uploading preloader
     */
    public hidePreloader(): void {
        this.nodes.loader.style.backgroundImage = '';
        this.toggleStatus(BlockState.Empty);
    }

    public fillImage(url: string): void {
        //TODO check this regex
        const tag = /\.mp4$/.test(url) ? 'VIDEO' : 'IMG';
        const isVideo = tag == 'VIDEO';

        if (isVideo) {
            this.nodes.media = parseStringToEl(/*html*/`
                <video src="${url}" autoplay loop muted playsinline >`) as HTMLVideoElement
        }
        else {
            this.nodes.media = parseStringToEl(/*html*/`
                <img src="${url}">`) as HTMLImageElement
        }

        const listener = () => {
            this.toggleStatus(BlockState.Filled);


            if (this.nodes.loader !== undefined) {
                this.nodes.loader.style.backgroundImage = '';
            }
        }
        this.nodes.media.addEventListener(isVideo ? 'loadeddata' : "load", listener);

        this.nodes.imageContainer.appendChild(this.nodes.media);
    }

    public fillCaption(text: string): void {
        if (this.nodes.caption !== undefined) {
            this.nodes.caption.innerText = text;
        }
    }

    private get CSS(): Record<string, string> {
        return {
            baseClass: this.api.styles.block,
            loading: this.api.styles.loader,
            input: this.api.styles.input,
            button: this.api.styles.button,

            /**
             * Tool's classes
             */
            wrapper: 'image-tool',
            imageContainer: 'image-tool__image',
            imagePreloader: 'image-tool__image-preloader',
            imageEl: 'image-tool__image-picture',
            caption: 'image-tool__caption',
        };
    };

    private toggleStatus(status: BlockState) {

    }
}

export function parseStringToEl(html: string): HTMLElement {
    const parser = new DOMParser();
    const el = parser.parseFromString(html, 'text/html').body.firstElementChild
    return el as HTMLElement;
}