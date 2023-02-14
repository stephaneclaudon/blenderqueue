import { RenderItemData } from "./RenderItemData";

export class BlenderQueueData {
    public settings: BlenderQueueSettings = new BlenderQueueSettings();
    public session: Array<Object> = [];
    constructor() { };
};

export class BlenderQueueSettings {
    public blenderBinaryPath: string = '';
    public saveProgressInfosPath: string = '';
    public saveProgressInfosTxt: boolean = false;
    public saveProgressInfosGUI: boolean = false;
    constructor() { };
};