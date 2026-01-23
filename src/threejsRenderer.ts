import { IconCross, IconFile, IconGlobe, IconLoader } from '@codexteam/icons'
import { API } from '@editorjs/editorjs'
import { FileUrl, Media3DLocalConfig } from '.'
import { UploadIcon } from './icons'
import { ThreeJsLoader } from './threeJsLoader'

export class ThreejsRenderer {
    private api: API
    private config: Media3DLocalConfig
    constructor({ api, config }: { api: API; config: Media3DLocalConfig }) {
        this.api = api
        this.config = config
    }
    private get CSS() {
        return {

        }
    }

    public renderViewerFormat(mainFile: FileUrl, secondaryFiles: FileUrl[]): HTMLElement {
        const { url, extension: format } = mainFile
        const element = document.createElement('div')
        element.innerText = `Rendering format: ${format} from URL: ${url}`
        return element
    }

}
