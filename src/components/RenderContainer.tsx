import React, { useState, useEffect } from 'react';
import { informationCircleOutline, timeOutline, hardwareChipOutline, trashOutline } from 'ionicons/icons';
import { IonItem, IonCol, IonGrid, IonInput, IonRow, IonToggle, IonProgressBar, IonLabel, IonSelect, IonSelectOption, IonIcon } from '@ionic/react';
import { GetBlenderFileInfo } from '../services/services';

import './RenderContainer.css';

export interface RenderContainerProps {
  index: number,
  blendFile: File,
  onChange: Function,
  onDelete: Function
}

export class RenderItemData {
  index: number= 0;
  enabled: boolean = true;
  scene: string = '';
  startFrame: number = 0;
  endFrame: number = 0;
  status: string = 'pending';
  command: string = "";
  blendFileData: Array<any> = [];
}
const debug: boolean = true;

const RenderContainer: React.FC<RenderContainerProps> = (props) => {
  const [initializing, setInitializing] = useState(true);
  const [data, setData] = useState(new RenderItemData());

  useEffect(() => {

    if (!initializing) return;
    //@ts-ignore
    GetBlenderFileInfo(props.blendFile.path)
      .then((dataObject: any) => {
        let newData = new RenderItemData();
        newData.blendFileData = dataObject;
        newData.index = props.index;
        onSceneChange(newData.blendFileData[0].name, newData);
        setInitializing(false);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const onSceneChange = (sceneName: string, newData?: RenderItemData) => {
    let sceneData: any;
    if (newData) {
      sceneData = newData.blendFileData.filter((scene: any) => scene.name == sceneName)[0];
    } else {
      if (data.blendFileData.length == 0) return;
      newData = { ...data };
      sceneData = newData.blendFileData.filter((scene: any) => scene.name == sceneName)[0];
    }

    newData = {
      ...newData,
      scene: sceneName,
      startFrame: sceneData.start,
      endFrame: sceneData.end
    };

    updateData(newData);
  };

  const updateData = (rData: RenderItemData) => {
    rData = {
      ...rData,
      command: getCommand(rData)
    } 
    setData(rData);

    props.onChange(rData);
  };

  const OnStartChange = (event: any) => {
    updateData(
      {
        ...data,
        startFrame: event.target.value as number
      });
  }
  const OnEndChange = (event: any) => {
    updateData(
      {
        ...data,
        endFrame: event.target.value as number
      });
  };

  const OnEnableChange = () => {
    updateData({
      ...data,
      enabled: !data.enabled
    });
  };

  const deleteItem = () => {
    props.onDelete();
  };

  const getCommand = (rData: RenderItemData) => {
    let commandArguments = [
      "blender -b ",
      //@ts-ignore
      props.blendFile.path,
      "-a",
      "-S " + rData.scene,
      "-s " + rData.startFrame,
      "-e " + rData.endFrame
    ];
    return commandArguments.join(' ');
  };

  return (
    <>
      <IonGrid className='renderItem'>
        <IonRow className={initializing ? 'locked' : (data.enabled ? '' : 'disabled')}>
          <IonCol size="1" className='toggle'>
            <IonToggle checked={data.enabled} onIonChange={OnEnableChange}></IonToggle>
          </IonCol>
          <IonCol size="1">
            {(data.status === 'pending') && <IonIcon size="large" icon={timeOutline}></IonIcon>}
            {(data.status === 'computing') && <IonIcon size="large" icon={hardwareChipOutline}></IonIcon>}
          </IonCol>
          <IonCol size="3">
            <IonLabel>{props.blendFile.name}</IonLabel>
          </IonCol>
          <IonCol>
            <IonSelect placeholder="Scene" onIonChange={(event) => onSceneChange(event.target.value)} value={data.scene}>
              {data.blendFileData.map((scene, index) =>
                <IonSelectOption key={index} value={scene["name"]}>{scene["name"]}</IonSelectOption>
              )}
            </IonSelect>
          </IonCol>
          <IonCol>
            <IonInput
              placeholder={data.startFrame.toString()}
              onIonChange={OnStartChange}
              value={data.startFrame}>
            </IonInput>
          </IonCol>
          <IonCol>
            <IonInput
              placeholder={data.endFrame.toString()}
              onIonChange={OnEndChange}
              value={data.endFrame}>

            </IonInput>
          </IonCol>
          <IonCol>
            <IonIcon size="large" icon={informationCircleOutline}></IonIcon>
          </IonCol>
          <IonCol>
            <IonIcon className='delete' onClick={deleteItem} size="large" icon={trashOutline}></IonIcon>
          </IonCol>
        </IonRow>

        {initializing &&
          <IonRow>
            <IonProgressBar type={initializing ? 'indeterminate' : 'determinate'}></IonProgressBar>
          </IonRow>
        }

        {debug &&
          <IonRow>
            <p>{data.command}</p>
          </IonRow>
        }
      </IonGrid>
    </>
  );
};

export default RenderContainer;
