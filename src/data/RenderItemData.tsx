import { BlenderExtractData } from "./BlenderExtractData";
import { GetBlenderFileInfo } from '../services/services';
import { publish } from "../events/events";


export class RenderItemData {
  public static STATUS_PENDING = 'pending';
  public static STATUS_RENDERING = 'rendering';
  public static STATUS_DONE = 'done';
  public static STATUS_ERROR = 'error';

  public blendFileData: BlenderExtractData = new BlenderExtractData();
  public blendFilePath: string = "";
  public blendFileName: string = "";
  public index: number = 0;
  public initializing: boolean = true;
  public enabled: boolean = true;
  public sceneName: string = '';
  public startFrame: number = 0;
  public endFrame: number = 0;
  public status: string = RenderItemData.STATUS_PENDING;
  public commandArgs: Array<string> = [];


  constructor() {
    
  }

  public init (blendFile:File) {
    this.blendFileName = blendFile.name;
    //@ts-ignore
    this.blendFilePath = blendFile.path;

    GetBlenderFileInfo(this.blendFilePath)
      .then((dataObject: BlenderExtractData) => {
        this.blendFileData = dataObject;
        this.scene = this.blendFileData.scenes[0].name;
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

  }

  public set scene(name: string) {
    this.sceneName = name;
    this.selectScene(name);
  }

  public get scene() {
    return this.sceneName;
  }

  public get isDone() {
    return this.status === RenderItemData.STATUS_DONE;
  }

  public get isRendering() {
    return this.status === RenderItemData.STATUS_RENDERING;
  }

  public updateCommand() {
    this.commandArgs = [
      "-b",
      this.blendFilePath,
      "-S", this.scene,
      "-s", this.startFrame.toString(),
      "-e", this.endFrame.toString(),
      "-a"
    ];
  };

}