import { BlenderExtractData, BlenderExtractSceneData } from "./BlenderExtractData";
import { v4 as uuidv4 } from 'uuid';
import * as Services from "../services/services";

export class RenderItemData {
  public static STATUS_PENDING = 'pending';
  public static STATUS_RENDERING = 'rendering';
  public static STATUS_PAUSED = 'paused';
  public static STATUS_DONE = 'done';
  public static STATUS_ERROR = 'error';
  public static STATUS_INITIALIZING = 'initializing';

  public blendFileData: BlenderExtractData = new BlenderExtractData();
  public blendFilePath: string = "";
  public blendFileName: string = "";
  public enabled: boolean = true;
  public sceneName: string = '';
  public sceneData: BlenderExtractSceneData = new BlenderExtractSceneData();
  public startFrame: number = 0;
  public endFrame: number = 0;
  public outputFilePath: string = '';
  public outputFilePathExists: boolean = false;
  public status: string = RenderItemData.STATUS_PENDING;
  public commandArgs: Array<string> = [];
  public uuid: string = "";
  public selected: boolean = false;
  public expanded: boolean = false;

  constructor() {
    this.resetUuid();
  }

  public resetUuid() {
    this.uuid = uuidv4();
  }

  public init(blendFile: File, onSuccess: Function, onError: Function = () => { }) {
    this.blendFileName = blendFile.name;
    //@ts-ignore
    this.blendFilePath = blendFile.path;
    this.getBlenderFileInfo(onSuccess, onError);
  }

  public reset(onSuccess: Function, onError: Function = () => { }) {
    this.getBlenderFileInfo(onSuccess, onError);
  }

  public resetStatus() {
    this.status = RenderItemData.STATUS_PENDING;
  }

  private getBlenderFileInfo(onSuccess: Function, onError: Function) {
    this.status = RenderItemData.STATUS_INITIALIZING;
    Services.GetBlenderFileInfo(this.blendFilePath)
      .then((dataObject: BlenderExtractData) => {
        this.blendFileData = dataObject;
        this.selectScene(this.blendFileData.scenes[0].name).finally(() => {
          this.status = RenderItemData.STATUS_PENDING;
          if (onSuccess)
            onSuccess();
        });
      })
      .catch((error: any) => {
        this.status = RenderItemData.STATUS_ERROR;
        if (onError)
          onError('Couldn\'t retrieve scenes from ' + this.blendFileName);
      })
  }

  public selectScene(sceneName: string) {
    return new Promise((resolve, reject) => {
      this.sceneName = sceneName;
      this.sceneData = this.blendFileData.getScene(sceneName);
      this.startFrame = this.sceneData.start;
      this.endFrame = this.sceneData.end;
      this.outputFilePath = this.sceneData.filepath;
  
      Services.CheckOutputFolder(this.outputFilePath).then((exists: boolean) => {
        this.outputFilePathExists = exists;
        this.expanded = !this.outputFilePathExists;
        resolve(true);
      }).catch((error:any) => {
        reject(error);
      });
    });
    
  }

  public get scene() {
    return this.sceneName;
  }

  public get isReady() {
    return this.enabled && this.isPending && !this.isInitializing;
  }

  public get isInitializing() {
    return this.status === RenderItemData.STATUS_INITIALIZING;
  }

  public get isPending() {
    return this.status === RenderItemData.STATUS_PENDING;
  }

  public get isDone() {
    return this.status === RenderItemData.STATUS_DONE;
  }

  public get isPaused() {
    return this.status === RenderItemData.STATUS_PAUSED;
  }

  public get hasFailed() {
    return this.status === RenderItemData.STATUS_ERROR;
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
      "-o", this.outputFilePath.toString(),
      "-a"
    ];
  };

  public deserializeData() {
    let fileData = new BlenderExtractData();
    Object.assign(fileData, this.blendFileData);
    this.blendFileData = fileData;
  }

}