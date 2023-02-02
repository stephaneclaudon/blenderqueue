import { BlenderExtractData } from "../data/BlenderExtractData";
import { RenderItemData } from "../data/RenderItemData";
import { mockoutput } from './data-mock/blender-output-cycles';

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
                let json: any = JSON.parse('{"scenes":[{"name": "Scene", "start": 1, "end": 250, "resolution_x": 1920, "resolution_y": 1080, "filepath": "/Volumes/DATA/RESSOURCES/_BLENDER SCRIPTS/BlednerExtract/", "file_format": "PNG", "color": "RGBA", "film_transparent": true}, {"name": "Scene.001", "start": 40, "end": 250, "resolution_x": 1920, "resolution_y": 1080, "filepath": "/tmp/", "file_format": "PNG", "color": "RGBA", "film_transparent": false}]}');
                let data: BlenderExtractData = Object.assign(new BlenderExtractData(), json);
                resolve(data);
            }, 750);
        }
    });
}

export class RenderJob {

    private binary: string;
    private args: Array<string>;

    public onUpdate: () => void = () => { };
    public onOutput: (data: any) => void = () => { };
    public onError: (data: any) => void = () => { };
    public onClose: (code: number) => void = () => { };

    public outputString: string = "";

    public frame: number = 0;

    public currentSamples: number = 0;
    public totalSamples: number = 0;

    public lastFrameFilePath: string = "";
    public lastFrameTime: number = 0;

    public startTime: number = 0;
    public elapsedTime: number = 0;
    public remainingTime: number = 0;

    public running: boolean = false;
    public paused: boolean = false;
    public stoped: boolean = false;

    public renderItem: RenderItemData;


    constructor(renderItem: RenderItemData) {
        this.renderItem = renderItem;
        this.binary = 'blender';
        this.args = this.renderItem.commandArgs;
        this.frame = this.renderItem.startFrame;
    }

    public start() {
        this.stoped = false;
        this.paused = false;
        this.startTime = Date.now();
        this.renderItem.status = RenderItemData.STATUS_RENDERING;
        let lines = [];


        //If electron not started, return fake data
        try {
            console.log("window.api.invoke('Render'");
            //@ts-ignore
            window.electronAPI.onRenderUpdate((event, data) => {
                lines = this.parseLines(data as string);
                for (const line of lines) {
                    this.parseLine(line.toString());
                }
            });
            //@ts-ignore
            window.electronAPI.onRenderError((event, error) => {
                this.renderItem.status = RenderItemData.STATUS_ERROR;
                console.error(error);

                //this.onError(error);
            });
            //@ts-ignore
            window.electronAPI.onRenderClose((event, code) => {
                console.log(code);
                this.renderItem.status = RenderItemData.STATUS_DONE;
                //this.onClose(code);
            });

            //@ts-ignore
            window.electronAPI.invoke('Render', { 'binary': this.binary, 'args': this.args });
        } catch (error) {
            const lines = this.parseLines(mockoutput);
            try {
                let seek = 0;
                if (lines) {
                    const interval = () => {
                        this.parseLine(lines[seek].toString());
                        console.log(this.stoped ,this.paused);

                        if (seek < (lines.length - 1) && !this.stoped && !this.paused) {
                            seek++;
                            setTimeout(interval, 5);
                        }
                        else if (!this.stoped && !this.paused) {
                            this.renderItem.status = RenderItemData.STATUS_DONE;
                            this.onClose(1);
                        }
                    };
                    interval();
                }
            } catch (error) {
                console.error(error);
            }
        }
        this.running = true;
    }

    public stopRender() {
        this.stoped = true;
        //@ts-ignore
        try { window.electronAPI.invoke('StopRender', {});}catch{}
    }
    public pauseRender() {
        this.paused = true;
        //@ts-ignore
        try { window.electronAPI.invoke('PauseRender', {});}catch{}
    }
    public resumeRender() {
        this.paused = false;
        //@ts-ignore
        try { window.electronAPI.invoke('ResumeRender', {});}catch{}
    }

    private parseLines(str: string) {
        return [...str.matchAll(/[^\r\n]+/g)];
    }

    //TODO : Cycles Renderer only... 
    private parseLine(line: string) {
        try {
            this.outputString += (line + '\r\n');

            let regex;
            let matches;

            //Parsing frame number
            regex = /Fra:(?<frame>\d*)\s/;
            matches = line.match(regex);

            if (matches && matches.groups)
                this.frame = parseInt(matches.groups.frame);

            //Parsing current rendering frame evolution
            regex = /Fra:(?<frame>\d*).*Sample\s(?<currentSamples>\d*)\/(?<totalSamples>\d*)/;
            matches = line.match(regex);

            if (matches && matches.groups) {
                this.frame = parseInt(matches.groups.frame);
                this.currentSamples = parseInt(matches.groups.currentSamples);
                this.totalSamples = parseInt(matches.groups.totalSamples);
            }

            //Parsing last frame file path
            regex = /Saved:\s\'(?<lastFrameFilePath>.*)\'/;
            matches = line.match(regex);
            if (matches && matches.groups) {
                //@ts-ignore
                window.electronAPI.invoke('SavePreview', { 'filePath': matches.groups.lastFrameFilePath }).then((previewFilePath: string) => {
                    console.log(previewFilePath);

                    this.lastFrameFilePath = previewFilePath + '?' + Math.random().toString();
                });
            }


            //Parsing last frame time values
            regex = /Time:\s(?<minutes>\d*)\:(?<seconds>\d*)\.(?<hundredth>\d*)\s\(Saving/;
            matches = line.match(regex);
            if (matches && matches.groups) {
                this.lastFrameTime = 0;
                this.lastFrameTime += (parseInt(matches.groups.minutes) * 60);
                this.lastFrameTime += (parseInt(matches.groups.seconds));
                this.lastFrameTime += parseInt(matches.groups.hundredth) / 100;
                this.lastFrameTime *= 1000; //To milliseconds
            }

            this.remainingTime = (this.renderItem.endFrame - this.frame) * this.lastFrameTime;
            this.elapsedTime = Date.now() - this.startTime;

            this.onUpdate();
        } catch (error) {
            console.error(error);
        }

    }
}