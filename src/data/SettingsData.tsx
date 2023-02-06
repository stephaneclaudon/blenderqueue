import { RenderItemData } from "./RenderItemData";

export class BlenderQueueData {
    public settings: BlenderQueueSettings = new BlenderQueueSettings;
    public session: Array<RenderItemData> = [];

    constructor() {};
};

export class BlenderQueueSettings {
    public blenderBinaryPath:string = '';
    constructor() {};
};