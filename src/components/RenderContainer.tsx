import React, { useState, useEffect } from 'react';
import { informationCircleOutline, timeOutline, hardwareChipOutline, trashOutline } from 'ionicons/icons';
import { IonItem, IonCol, IonGrid, IonInput, IonRow, IonToggle, IonProgressBar, IonLabel, IonSelect, IonSelectOption, IonIcon } from '@ionic/react';
import { GetBlenderFileInfo } from '../services/services';

import './RenderContainer.css';

export interface RenderContainerProps {
  blendFile: File,
  /*scenes: Array<string>,
  startFrame: number,
  endFrame: number,
  enabled: boolean,
  status: string,*/
  onChange: Function
}


const RenderContainer: React.FC<RenderContainerProps> = (props) => {
  const [initializing, setInitializing] = useState(true);
  const [blendFileData, setBlendFileData] = useState([]);
  const [startFrame, setStartFrame] = useState(0);
  const [endFrame, setEndFrame] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    //@ts-ignore
    GetBlenderFileInfo(props.blendFile.path)
      .then((data) => {
        setBlendFileData(data as []);
        setInitializing(false);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const OnEnableChange = () => {
    setEnabled(!enabled);
  };

  console.log(enabled);
  


  return (
    <>


      <IonGrid className='renderItem'>
        <IonRow className={initializing ? 'locked' : (enabled ? '' : 'disabled')}>
          <IonCol size="1" className='toggle'>
            <IonToggle checked={enabled} onIonChange={OnEnableChange}></IonToggle>
          </IonCol>
          <IonCol size="1">
            {(status === 'pending') && <IonIcon size="large" icon={timeOutline}></IonIcon>}
            {(status === 'computing') && <IonIcon size="large" icon={hardwareChipOutline}></IonIcon>}
          </IonCol>
          <IonCol size="3">
            <IonLabel>{props.blendFile.name}</IonLabel>
          </IonCol>
          <IonCol >
            <IonSelect placeholder="Scene">
              {blendFileData.map((scene, index) =>
                <IonSelectOption key={index} value={scene["name"]}>{scene["name"]}</IonSelectOption>
              )}
            </IonSelect>
          </IonCol>
          <IonCol>
            <IonInput placeholder={startFrame.toString()}></IonInput>
          </IonCol>
          <IonCol>
            <IonInput placeholder={endFrame.toString()}></IonInput>
          </IonCol>
          <IonCol>
            <IonIcon size="large" icon={informationCircleOutline}></IonIcon>
          </IonCol>
          <IonCol>
            <IonIcon size="large" icon={trashOutline}></IonIcon>
          </IonCol>
        </IonRow>
        {initializing &&
          <IonRow>
            <IonProgressBar type={initializing ? 'indeterminate' : 'determinate'}></IonProgressBar>
          </IonRow>
        }
      </IonGrid>

      {/*
        <IonItem>
          <IonToggle checked={true}></IonToggle>

          <IonLabel>{props.blendFile.name}</IonLabel>

          <IonSelect placeholder="Scene">
            {props.scenes.map((value, index) =>
              <IonSelectOption key={index} value={value}>{value}</IonSelectOption>
            )}
          </IonSelect>

          <IonInput placeholder={props.startFrame.toString()}></IonInput>

          <IonInput placeholder={props.endFrame.toString()}></IonInput>

          <IonIcon icon={informationCircle} slot="end"></IonIcon>

        </IonItem>
            */}
    </>
  );
};

export default RenderContainer;
