import { BlenderExtractData } from "./BlenderExtractData";
import { GetBlenderFileInfo } from '../services/services';
import { publish } from "../events/events";

interface myCallbackType { (): void }

export class RenderItemData {
  public blendFileData: BlenderExtractData = new BlenderExtractData();
  public blendFile: File;
  public index: number = 0;
  public initializing: boolean = true;
  public enabled: boolean = true;
  public sceneName: string = '';
  public startFrame: number = 0;
  public endFrame: number = 0;
  public status: string = 'pending';
  public commandArgs: Array<string> = [];


  constructor(blendFile: File) {
    console.log("New renderitemdata : ", blendFile.name);
    this.blendFile = blendFile;

    //@ts-ignore
    GetBlenderFileInfo(this.blendFile.path)
      .then((dataObject: BlenderExtractData) => {
        this.blendFileData = dataObject;
        this.scene = this.blendFileData.scenes[0].name;
        console.log(this.blendFile.name + " loaded");
        
      })
      .catch((error: any) => {
        console.error(error);
      }).finally(() => {
        publish('updateList', null);
        this.initializing = false;
      });
  }

  public selectScene(sceneName: string) {
    let sceneData = this.blendFileData.getScene(sceneName);
    this.startFrame = sceneData.start;
    this.endFrame = sceneData.end;

    console.log("selectScene", sceneName);
  }

  public set scene(name: string) {
    this.sceneName = name;
    this.selectScene(name);
  }

  public get scene() {
    return this.sceneName;
  }

  public updateCommand() {
    this.commandArgs = [
      "-b",
      //@ts-ignore
      this.blendFile.path,
      "-a",
      "-S " + this.scene,
      "-s " + this.startFrame,
      "-e " + this.endFrame
    ];
  };

}