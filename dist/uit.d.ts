import { API } from "@editorjs/editorjs";
type ConstructorProps = {
    api: API;
    readOnly: boolean;
};
export declare class Ui {
    private nodes;
    private api;
    private readOnly;
    constructor({ api, readOnly }: ConstructorProps);
}
export declare function parseStringToEl(html: string): HTMLElement;
export {};
