import { BlenderExtractData, BlenderExtractSceneData } from "./BlenderExtractData";
import { GetBlenderFileInfo } from '../services/services';
import { publish } from "../events/events";
import {v4 as uuidv4} from 'uuid';

export class RenderItemData {
  public static STATUS_PENDING = 'pending';
  public static STATUS_RENDERING = 'rendering';
  public static STATUS_DONE = 'done';
  public static STATUS_ERROR = 'error';

  public blendFileData: BlenderExtractData = new BlenderExtractData();
  public blendFilePath: string = "";
  public blendFileName: string = "";
  public initializing: boolean = true;
  public enabled: boolean = true;
  public sceneName: string = '';
  public sceneData: BlenderExtractSceneData = new BlenderExtractSceneData();
  public startFrame: number = 0;
  public endFrame: number = 0;
  public status: string = RenderItemData.STATUS_PENDING;
  public commandArgs: Array<string> = [];
  public uuid: string = "";

  constructor() {
    this.resetUuid();
  }

  public resetUuid() {
    this.uuid = uuidv4();
  }

  public init(blendFile: File, onSuccess: Function, onError: Function=()=>{}) {
    this.blendFileName = blendFile.name;
    //@ts-ignore
    this.blendFilePath = blendFile.path;
    this.getBlenderFileInfo(onSuccess, onError);
  }

  public reset(onSuccess: Function, onError: Function=()=>{}) {
    this.getBlenderFileInfo(onSuccess, onError);
  }

  private getBlenderFileInfo(onSuccess: Function, onError: Function) {
    this.initializing = true;
    GetBlenderFileInfo(this.blendFilePath)
      .then((dataObject: BlenderExtractData) => {
        this.blendFileData = dataObject;
        this.scene = this.blendFileData.scenes[0].name;
        this.status = RenderItemData.STATUS_PENDING;
        if(onSuccess)
          onSuccess();
      })
      .catch((error: any) => {
        this.status = RenderItemData.STATUS_ERROR;
        publish('errorAlert', {
          header: 'Error',
          subHeader: 'Couldn\'t retrieve scenes from ' + this.blendFileName,
          message: error
        });
        if(onError)
          onError();
      }).finally(() => {
        this.initializing = false;
      });
  }

  public selectScene(sceneName: string) {
    this.sceneData = this.blendFileData.getScene(sceneName);
    this.startFrame = this.sceneData.start;
    this.endFrame = this.sceneData.end;
  }

  public set scene(name: string) {
    this.sceneName = name;
    this.selectScene(name);
  }

  public get scene() {
    return this.sceneName;
  }

  public get isReady() {
    return this.status === RenderItemData.STATUS_PENDING && this.enabled;
  }

  public get isDone() {
    return this.status === RenderItemData.STATUS_DONE;
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
      "-a"
    ];
  };

}