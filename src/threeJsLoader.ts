

type LoaderName = 'OBJ' | 'FBX' | 'GLTF' | "MTL";
type ThreeCore = {
    THREE: typeof import('three')
    OrbitControls: typeof import('three/examples/jsm/controls/OrbitControls').OrbitControls
}

export class ThreeJsLoader {
    private static corePromise: Promise<ThreeCore> | null = null
    private static loaderPromises: Partial<Record<LoaderName, Promise<any>>> = {}

    private static async loadCore(): Promise<ThreeCore> {
        if (this.corePromise) return this.corePromise
        this.corePromise = (async () => {
            const [{ default: THREE }, { OrbitControls }] = await Promise.all([
                import('three'),
                import('three/examples/jsm/controls/OrbitControls'),
            ])
            return { THREE, OrbitControls }
        })()
        return this.corePromise
    }
    static async getLoader(name: LoaderName) {
        if (!this.loaderPromises[name]) {
            this.loaderPromises[name] = this.loadSpecificLoader(name)
        }
        return this.loaderPromises[name]
    }

    private static async loadSpecificLoader(name: LoaderName) {
        switch (name) {
            case 'OBJ':
                return import('three/examples/jsm/loaders/OBJLoader').then((m) => m.OBJLoader)
            case 'FBX':
                return import('three/examples/jsm/loaders/FBXLoader').then((m) => m.FBXLoader)
            case 'GLTF':
                return import('three/examples/jsm/loaders/GLTFLoader').then((m) => m.GLTFLoader)
            case 'MTL':
                return import('three/examples/jsm/loaders/MTLLoader').then((m) => m.MTLLoader)
            default:
                throw new Error(`Unknown loader: ${name}`)
        }
    }
}