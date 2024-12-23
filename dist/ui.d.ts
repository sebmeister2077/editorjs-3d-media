import { API } from "@editorjs/editorjs";
import { Tool360MediaData } from "./types";
type NodeNames = "wrapper" | "caption" | "imageContainer" | "fileButton" | "loader";
type ConstructorProps = {
    api: API;
    readOnly: boolean;
    onSelectFile(): void;
};
export declare class Ui {
    nodes: Record<NodeNames, HTMLElement> & {
        media: null | HTMLImageElement | HTMLVideoElement;
    };
    private api;
    private readOnly;
    private onSelectFile;
    constructor({ api, readOnly, onSelectFile }: ConstructorProps);
    render(toolData: Tool360MediaData): HTMLElement;
    applyTune(tuneName: string, status: boolean): void;
    showPreloader(src: string): void;
    /**
     * Hide uploading preloader
     */
    hidePreloader(): void;
    fillImage(url: string): void;
    fillCaption(text: string): void;
    private get CSS();
    private toggleStatus;
}
export declare function parseStringToEl(html: string): HTMLElement;
export {};
