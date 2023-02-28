import { BlenderExtractData } from "../data/BlenderExtractData";
import { RenderItemData } from "../data/RenderItemData";
import { BlenderQueueData } from "../data/SettingsData";
import { mockoutput } from './data-mock/blender-output-cycles';

export const GetData = () => {
    return new Promise<BlenderQueueData>(function (resolve, reject) {
        //If electron not started, return fake data
        try {
            //@ts-ignore
            return window.electronAPI.invoke('GetData', { settingName: 'data' }).then(function (res: any) {
                let data: BlenderQueueData = Object.assign(new BlenderQueueData(), res);
                resolve(data);
            })
                .catch(function (err: any) {
                    reject(err);
                });
        } catch (error) {
            console.warn('GetData(), electron not started, returning fake data');
            setTimeout(() => {
                resolve(new BlenderQueueData());
            }, 1500);
        }
    });
}

export const SaveData = (data: BlenderQueueData) => {
    return new Promise(function (resolve, reject) {
        //If electron not started, return fake data
        try {
            //@ts-ignore
            window.electronAPI.invoke(
                'SaveData', data).then(function (res: any) {
                    resolve(res);
                }).catch(function (err: any) {
                    reject(err);
                });
        } catch (error) {
            console.warn('SaveSettings(), electron not started, data will be lost');
            resolve({});
        }
    });
}

export const GetBlenderFileInfo = async (blendFilePath: string) => {
    return new Promise<BlenderExtractData | any>(function (resolve, reject) {
        //If electron not started, return fake data
        try {
            //@ts-ignore
            window.electronAPI.invoke('BlenderExtract', { 'blendFile': blendFilePath })
                .then(function (res: any) {
                    let data: BlenderExtractData = Object.assign(new BlenderExtractData(), res);
                    resolve(data);
                })
                .catch(function (err: any) {
                    reject(err);
                });
        } catch (error) {
            setTimeout(() => {
                let json: any = JSON.parse('{"scenes":[{"name": "Scene", "start": 1, "end": 250, "resolution_x": 1920, "resolution_y": 1080, "filepath": "/Volumes/DATA/RESSOURCES/_BLENDER SCRIPTS/BlednerExtract/", "file_format": "PNG", "color": "RGBA", "film_transparent": true, "engine": "CYCLES"}, {"name": "Scene.001--Eevvee", "start": 40, "end": 250, "resolution_x": 1920, "resolution_y": 1080, "filepath": "/tmp/", "file_format": "PNG", "color": "RGBA", "film_transparent": false, "engine": "BLENDER_EEVEE"}]}');
                let data: BlenderExtractData = Object.assign(new BlenderExtractData(), json);
                resolve(data);
                //reject('OUPS');
            }, 750);
        }
    });
}

export class RenderJob {

    private previewFormat: Array<string> = ['PNG', 'JPEG', 'JPEG2000'];
    private canPreviewFile: boolean = false;

    private args: Array<string> = [];

    public onUpdate: () => void = () => { };
    public onError: (data: string) => void = () => { };
    public onExit: (data: any) => void = () => { };
    public onClose: (code: number) => void = () => { };
    public onStop: () => void = () => { };

    public outputString: string = "";
    public outputStringLastLine: string = "";

    public frame: number = -1;

    public currentSamples: number = 0;
    public totalSamples: number = 0;

    public lastFrameFilePath: string = "";
    public lastFrameTime: number = 0;

    public progress: number = 0;
    public startTime: number = 0;
    public pausedTime: number = 0;
    public elapsedTime: number = 0;
    public remainingTime: number = 0;
    public currentFrameInitialRemainingTime: number = -1;
    public currentFrameRemainingTime: number = 0;
    public currentFrameProgress: number = 0;

    public running: boolean = false;
    public paused: boolean = false;
    public stoped: boolean = false;

    public renderItem: RenderItemData;


    constructor() {
        console.log("new RenderJob()");
        this.renderItem = new RenderItemData();
    }

    public init(renderItem: RenderItemData) {
        this.renderItem = renderItem;
        this.args = this.renderItem.commandArgs;
        this.frame = this.renderItem.startFrame;
        this.canPreviewFile = this.previewFormat.includes(this.renderItem.sceneData.file_format);
    }

    public start() {
        this.stoped = false;
        this.paused = false;
        this.startTime = Date.now();
        this.renderItem.status = RenderItemData.STATUS_RENDERING;
        let lines = [];

        //If electron not started, return fake data
        try {
            //@ts-ignore
            window.electronAPI.invoke('SetProgress', 2); //Value > 1 means progress is indeterminate
            //@ts-ignore
            window.electronAPI.onRenderUpdate((event, data) => {
                lines = this.parseLines(data as string);
                for (const line of lines) {
                    this.parseLine(line.toString());
                }
            });
            //@ts-ignore
            window.electronAPI.onRenderError(
                (event: any, error: string) => this.onRenderError(error)
            );
            //@ts-ignore
            window.electronAPI.onRenderClose(
                (event: any, code: any) => this.onRenderClose(code)
            );

            //@ts-ignore
            window.electronAPI.invoke(
                'Render',
                {
                    'args': this.args,
                    'logFileName': this.renderItem.blendFileName.split('.')[0] + '[' + this.renderItem.sceneName + ']-' + new Date(this.startTime).toLocaleString().replace(/[\/\:]/g, '-').replace(/[\,]/g, '') + '.txt'
                });
        } catch (error) {
            console.warn("RenderJob::Start(), electron not started, returning fake data", error);
            const lines = this.parseLines(mockoutput);
            try {
                let seek = 0;
                if (lines) {
                    const interval = () => {
                        if (seek < (lines.length - 1) && !this.paused && !this.stoped) {
                            this.parseLine(lines[seek].toString());
                            seek++;
                        }
                        else if (!this.stoped && !this.paused) {
                            this.renderItem.status = RenderItemData.STATUS_DONE;
                            this.onRenderClose(1);
                            return;
                        } else if (!this.paused) {
                            console.log("STOP");
                            this.onRenderClose(1);
                            return;
                        }
                        setTimeout(interval, 5);
                    };
                    interval();
                }
            } catch (error) {
                console.error(error);
            }
        }
        this.running = true;
    }

    public onRenderError(error: string) {
        console.error("Render encountered an error ", error);        
        this.renderItem.status = RenderItemData.STATUS_ERROR;
        this.onError(error);
    }

    public onRenderClose(code: number) {
        console.log("RenderJob::onRenderClose()");
        this.running = false;
        this.paused = false;
        if (!this.renderItem.hasFailed) {
            this.renderItem.status = RenderItemData.STATUS_DONE;
        }
        if (!this.stoped)
            this.onClose(code);
        //@ts-ignore
        window.electronAPI.invoke('SetProgress', -1);
    }

    public stopRender() {
        console.log("RenderJob::stopRender()");
        this.stoped = true;
        this.running = false;
        this.paused = false;
        this.renderItem.status = RenderItemData.STATUS_ERROR;
        this.onStop();
        //@ts-ignore
        try { window.electronAPI.invoke('StopRender', {}); } catch { }
    }
    public pauseRender() {
        this.pausedTime = Date.now();
        this.paused = true;
        this.renderItem.status = RenderItemData.STATUS_PAUSED;
        //@ts-ignore
        try { window.electronAPI.invoke('PauseRender', {}); } catch { }
    }
    public resumeRender() {
        this.startTime = this.startTime + (Date.now() - this.pausedTime);
        this.updateTime();
        this.paused = false;
        this.renderItem.status = RenderItemData.STATUS_RENDERING;
        //@ts-ignore
        try { window.electronAPI.invoke('ResumeRender', {}); } catch { }
    }

    private parseLines(str: string) {
        return [...str.matchAll(/[^\r\n]+/g)];
    }

    //TODO : Cycles Renderer only... 
    private parseLine(line: string) {
        try {
            this.outputString += (line + '\r\n');
            this.outputStringLastLine = line;

            let regex;
            let matches;

            //Parsing frame number
            regex = /Fra:(?<frame>\d*)\s/;
            matches = line.match(regex);

            if (matches && matches.groups) {
                let f = parseInt(matches.groups.frame);
                if (f !== this.frame) {
                    this.frame = parseInt(matches.groups.frame);
                    this.currentFrameInitialRemainingTime = -1;
                }
            }

            //Parsing currentFrame remaining time
            regex = /Remaining:(?<minutes>\d*)\:(?<seconds>\d*)\.(?<hundredth>\d*)\s\|/;
            matches = line.match(regex);
            if (matches && matches.groups) {
                this.currentFrameRemainingTime = this.computeTimeValues(matches.groups.minutes, matches.groups.seconds, matches.groups.hundredth);
                if (this.currentFrameInitialRemainingTime === -1)
                    this.currentFrameInitialRemainingTime = this.currentFrameRemainingTime;

                this.currentFrameProgress = (this.currentFrameInitialRemainingTime - this.currentFrameRemainingTime) / this.currentFrameInitialRemainingTime;
            }


            //Parsing current rendering frame evolution
            regex = /Fra:(?<frame>\d*).*Sample\s(?<currentSamples>\d*)\/(?<totalSamples>\d*)/;
            matches = line.match(regex);

            if (matches && matches.groups) {
                this.frame = parseInt(matches.groups.frame);
                this.currentSamples = parseInt(matches.groups.currentSamples);
                this.totalSamples = parseInt(matches.groups.totalSamples);
            }

            if (this.canPreviewFile) {
                //Parsing last frame file path
                regex = /Saved:\s\'(?<lastFrameFilePath>.*)\'/;
                matches = line.match(regex);
                if (matches && matches.groups) {
                    //@ts-ignore
                    window.electronAPI.invoke('SavePreview', { 'filePath': matches.groups.lastFrameFilePath }).then((previewFilePath: string) => {
                        this.lastFrameFilePath = previewFilePath + '?' + Math.random().toString();
                    });
                }
            }


            //Parsing last frame time values
            regex = /Time:\s(?<minutes>\d*)\:(?<seconds>\d*)\.(?<hundredth>\d*)\s\(Saving/;
            matches = line.match(regex);
            if (matches && matches.groups)
                this.lastFrameTime = this.computeTimeValues(matches.groups.minutes, matches.groups.seconds, matches.groups.hundredth);



            this.updateTime();

            this.progress = (this.frame - this.renderItem.startFrame) / (this.renderItem.endFrame - this.renderItem.startFrame + 1);
            if (this.progress > 0) {
                //@ts-ignore
                window.electronAPI.invoke('SetProgress', this.progress);
            }

            this.onUpdate();
        } catch (error) {
            console.warn(error);
        }
    }

    private updateTime() {
        this.remainingTime = (this.renderItem.endFrame - this.frame) * this.lastFrameTime;
        this.elapsedTime = Date.now() - this.startTime;
    }

    private computeTimeValues(minutes: string, seconds: string, hundredth: string) {
        let time = 0;
        time += (parseInt(minutes) * 60);
        time += (parseInt(seconds));
        time += parseInt(hundredth) / 100;
        time *= 1000; //To milliseconds

        return time;
    }

    public get isFrameInitializing() {
        return (this.currentFrameInitialRemainingTime === -1);
    }
}

export const ShowSaveDialog = (path: string) => {
    return new Promise(function (resolve, reject) {
        //If electron not started, return fake data
        try {
            //@ts-ignore
            window.electronAPI.invoke(
                'ShowSaveDialog', path).then(function (res: any) {
                    resolve(res);
                }).catch(function (err: any) {
                    reject(err);
                });
        } catch (error) {
            console.warn('ShowSaveDialog(), electron not started, can\'t open dialog');
            resolve({filePath: "/Fake/Folder/path"});
        }
    });
}

export const OpenFolder = (path: string) => {
    return new Promise(function (resolve, reject) {
        //If electron not started, return fake data
        try {
            //@ts-ignore
            window.electronAPI.invoke(
                'ShowItemInFolder', path).then(function (res: any) {
                    resolve(res);
                }).catch(function (err: any) {
                    reject(err);
                });
        } catch (error) {
            console.warn('OpenFolder(), electron not started, can\'t open dialog');
            resolve({});
        }
    });
}

export const BrowseFolder = () => {
    //If electron not started, return fake data
    try {
        //@ts-ignore
        return window.electronAPI.invoke('ShowOpenDialog');
    }
    catch (error) {
        console.warn('BrowseFolder(), electron not started, can\'t open folder');
        return undefined;
    }
}

export const CheckOutputFolder = (path: string) => {
    //If electron not started, return fake data
    try {
        //@ts-ignore
        return window.electronAPI.invoke('CheckOutputFolder', path);
    }
    catch (error) {
        console.warn('CheckOutputFolder(), electron not started, can\'t check returning true...');
        return false;
    }
}
