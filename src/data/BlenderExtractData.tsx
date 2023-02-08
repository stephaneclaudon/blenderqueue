
export class BlenderExtractSceneData {
    public name: string = "";
    public start: number = 0;
    public end: number = 0;
    public resolution_x: number = 0;
    public resolution_y: number = 0;
    public filepath: string = "";
    public file_format: string = "";
    public color: string = "";
    public film_transparent: boolean = false;
    public engine: string = "";
}

export class BlenderExtractData {
    public scenes: Array<BlenderExtractSceneData> = [];

    public get sceneNames() {
        return this.scenes.map(scene => scene["name"]);
    }

    public getScene(sceneName:string) {
        return this.scenes.filter(scene => scene["name"] === sceneName)[0];
    }
}
