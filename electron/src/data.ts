
import Store from 'electron-store';
import os from 'os';
import commandExists from 'command-exists-promise';
export const isMac = os.platform() === "darwin";
export const isWindows = os.platform() === "win32";
export const isLinux = os.platform() === "linux";

export const OSX_DEFAULT_BLENDER_PATH = "/Applications/Blender.app/Contents/MacOS/Blender";
export const WINDOWS_DEFAULT_BLENDER_PATH = "C:\Program Files\Blender Foundation\Blender\blender.exe";
export const LINUX_DEFAULT_BLENDER_PATH = "blender";



export class DataManager {
    private dataObject: BlenderQueueData = new BlenderQueueData();
    private dataMainObjectName: string = 'data';
    //@ts-ignore
    private store = new Store({ data: new BlenderQueueData() });

    constructor() { }

    public async init() {
        let storedData = await this.store.get(this.dataMainObjectName) as BlenderQueueData;
        if (!storedData)
            this.SaveData(this.dataObject);
        else
            this.dataObject = storedData;

        return this.checkForBlenderBinary();
    }

    public async checkForBlenderBinary() {
        return new Promise((resolve, reject) => {
            if (!this.dataObject.settings.blenderBinaryPath || this.dataObject.settings.blenderBinaryPath === '') {
                console.log("Config file is empty, trying to guess blender's install folder...");
                let blendBinary = ''
                if (isMac) blendBinary = '/Applications/Blender.app/Contents/MacOS/Ble2nder';
                else if (isWindows) blendBinary = 'data.settings.blenderBinaryPath', 'C:\Program Files\Blender Foundation\Blender\blender.exe';
                else if (isLinux) blendBinary = 'data.settings.blenderBinaryPath', 'blender';
                commandExists(blendBinary)
                    .then(async exists => {
                        if (exists) {
                            this.dataObject.settings.blenderBinaryPath = blendBinary;
                            await this.SaveData(this.dataObject);
                            resolve(blendBinary + " exists, adding it to default config file.");
                        } else {
                            console.log(blendBinary + " Doesn't exists...");
                            reject('"' + blendBinary + '" doesn\'t exists, please check your settings...');
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        reject("Error trying guess blender's path, please check your settings...");
                    });
            } else {
                commandExists(this.dataObject.settings.blenderBinaryPath)
                    .then(async exists => {
                        if (exists) {
                            resolve(this.dataObject.settings.blenderBinaryPath + ' already set.');
                        } else {
                            reject('"' + this.dataObject.settings.blenderBinaryPath + '" doesn\'t exists, please check your settings...');
                        }
                    })
                    .catch(err => {
                        reject(err);
                    });
            }

        });
    }

    public GetData<BlenderQueueData>() {
        return this.dataObject;
    }

    public async SaveData(data: BlenderQueueData) {
        this.dataObject = Object.assign(new BlenderQueueData(), data);
        return this.store.set(this.dataMainObjectName, this.dataObject);
    }
}

export class BlenderQueueData {
    public settings: BlenderQueueSettings = new BlenderQueueSettings();
    public session: Array<Object> = [];

    constructor() { };

};

export class BlenderQueueSettings {
    public blenderBinaryPath: string = '';
    constructor() { };
};

