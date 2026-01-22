import { IconFile, IconGlobe, IconLoader } from "@codexteam/icons";
import { API } from "@editorjs/editorjs";
import { FileUrl, Media3DLocalConfig } from ".";
import { UploadIcon } from "./icons";

export class ThreejsRenderer {
    private api: API;
    private config: Media3DLocalConfig
    constructor({ api, config }: { api: API, config: Media3DLocalConfig }) {
        this.api = api;
        this.config = config;

    }
    private get CSS() {
        return {
            uploadWrapper: "cdx-3d-media-threejs-uploader-wrapper",
            uploadButton: "cdx-3d-media-threejs-upload-button",
        }
    }
    public requiresExtraAssets(format: string): boolean {
        const lowerCaseFormat = format.toLowerCase();
        const requiresAssets = this.getExtraAssetsForFormat(lowerCaseFormat);
        // TODO improve logic to check wether to show uploader for optional files too ?
        return requiresAssets.filter(asset => asset.required.length > 0).length > 0;
    }

    //#region Render Uploader by main file format
    /**
     * Some formats may need special handling or extra assets to be rendered correctly.
     * @example format: 'gltf', 'obj', 'fbx'
     * @param format 
     */
    public renderUploaderFormat(url: string, format: string, extraFiles: FileUrl[], addExtraFiles: (files: File[], type: "required" | "optional") => void): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.classList.add(this.CSS.uploadWrapper);


        const extraAssets = this.getExtraAssetsForFormat(format);

        const createUploadButton = ({ useGivenFile, isOptional, accept }: { useGivenFile?: boolean; isOptional?: boolean, accept?: string[] }): HTMLElement => {
            const uploadButton = document.createElement('div');
            uploadButton.classList.add(this.CSS.uploadButton);
            if (useGivenFile) {
                uploadButton.insertAdjacentHTML('beforeend', IconFile);
                uploadButton.title = url;
                uploadButton.appendChild(document.createTextNode(this.api.i18n.t('File type: ') + format.toUpperCase()));
            }
            else {
                if (!accept || accept.length === 0)
                    return uploadButton;
                const isMultiple = accept.length > 1;
                uploadButton.insertAdjacentHTML('beforeend', /*html*/ UploadIcon);
                let isValid = false;
                let message = `${isOptional ? 'Optional ' : 'Required'} Asset${isMultiple ? 's' : (': ' + accept.join(', '))}`
                if (extraFiles && extraFiles.length > 0) {
                    const matchedFiles = extraFiles.filter(file => {
                        const fileExtension = '.' + file.extension.toLowerCase();
                        return accept.includes(fileExtension);
                    });
                    if (matchedFiles.length > 0) {
                        isValid = true;
                        message = ` ${this.api.i18n.t('Required Files: ')} ${this.renderShortenedExtension(matchedFiles.map(file => file.extension))}`;
                    }
                }
                if (isValid) {
                    uploadButton.innerHTML = IconFile;
                    uploadButton.appendChild(document.createTextNode(this.api.i18n.t(message)));
                }
                else {
                    uploadButton.appendChild(document.createTextNode(this.api.i18n.t(message)));
                    uploadButton.title = this.api.i18n.t(`Accepted file type${isMultiple ? 's' : ''}: ${accept.join(', ')}`);

                    uploadButton.addEventListener('click', () => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.style.display = 'none';
                        fileInput.accept = accept.join(',');
                        fileInput.multiple = isMultiple
                        fileInput.addEventListener('change', (event: Event) => {
                            const target = event.target as HTMLInputElement;
                            if (!target.files || target.files.length === 0) return
                            const selectedFiles = Array.from(target.files);
                            const filteredFiles = selectedFiles.filter(file => {
                                const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
                                return accept.includes(fileExtension);
                            });

                            if (!isOptional) {
                                let isFulfilled = false;
                                // match if at least one of the required asset presets is fulfilled
                                for (const extraAsset of extraAssets) {
                                    isFulfilled = extraAsset.required.length == filteredFiles.length && extraAsset.required.every(reqExt => filteredFiles.some(file => file.name.toLowerCase().endsWith(reqExt)));
                                    if (!isFulfilled) continue;
                                    addExtraFiles(filteredFiles, "required");
                                    break;

                                }
                                if (!isFulfilled) {
                                    const message = this.api.i18n.t('Please select all required files: ') + accept.join(', ');
                                    this.api.notifier.show({ message, style: 'error' });
                                }
                            }
                            else {
                                addExtraFiles(filteredFiles, "optional");
                            }

                            fileInput.remove();
                        });
                        document.body.insertAdjacentElement('beforeend', fileInput);
                        fileInput.click();
                    });
                }

            }
            return uploadButton;
        }


        wrapper.appendChild(createUploadButton({ useGivenFile: true }));

        const combinedRequiredAssets = Array.from(new Set(extraAssets.reduce((acc, assetReq) => {
            return acc.concat(assetReq.required);
        }, [] as string[])));

        const combinedOptionalAssets = Array.from(new Set(extraAssets.reduce((acc, assetReq) => {
            return acc.concat(assetReq.optional);
        }, [] as string[])));

        if (combinedRequiredAssets.length > 0)
            wrapper.appendChild(createUploadButton({ accept: combinedRequiredAssets }));


        if (combinedOptionalAssets.length > 0)
            wrapper.appendChild(createUploadButton({ accept: combinedOptionalAssets, isOptional: true }));
        return wrapper;
    }

    public renderViewerFormat(format: string, url: string, otherAssets?: FileUrl[]): HTMLElement {
        const element = document.createElement('div');
        element.innerText = `Rendering format: ${format} from URL: ${url}`;
        return element;
    }


    private getExtraAssetsForFormat(format: string): AssetRequirements[] {
        // this way we can extend easily in the future
        // it can be array in case we can add extra required filetype1 or extra required filetype2
        const assetsMap: { [key: string]: AssetRequirements | AssetRequirements[] } = {
            'obj': {
                required: ['.mtl'],
                optional: ['.png', '.jpg', '.jpeg', '.tga']
            },
            'fbx': {
                required: ['.bin'],
                optional: ['.png']
            },
        };
        const lowerCaseFormat = format.toLowerCase();
        return assetsMap[lowerCaseFormat] ? (Array.isArray(assetsMap[lowerCaseFormat]) ? assetsMap[lowerCaseFormat] as AssetRequirements[] : [assetsMap[lowerCaseFormat] as AssetRequirements]) : [];
    }

    private renderShortenedExtension(extensions: string[]): string {
        // count how many duplicates are, for example 4 jpg files, and instead of showing JPG, show 4x JPG
        const extensionCountMap: { [key: string]: number } = {};
        extensions.forEach(ext => {
            const upperExt = ext.toUpperCase();
            if (extensionCountMap[upperExt]) {
                extensionCountMap[upperExt]++;
            } else {
                extensionCountMap[upperExt] = 1;
            }
        });
        return Object.entries(extensionCountMap).map(([ext, count]) => count > 1 ? `${count}x ${ext}` : ext).join(', ');

    }
}
type AssetRequirements = { required: string[], optional: string[] };