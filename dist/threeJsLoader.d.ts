type LoaderName = 'OBJ' | 'FBX' | 'GLTF' | "MTL";
export declare class ThreeJsLoader {
    private static corePromise;
    private static loaderPromises;
    private static loadCore;
    static getLoader(name: LoaderName): Promise<any>;
    private static loadSpecificLoader;
}
export {};
