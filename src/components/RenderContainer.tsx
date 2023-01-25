import React from 'react';
import { informationCircleOutline, timeOutline, hardwareChipOutline } from 'ionicons/icons';
import { IonItem, IonCol, IonGrid, IonInput, IonRow, IonToggle, IonProgressBar, IonLabel, IonSelect, IonSelectOption, IonIcon } from '@ionic/react';

import './RenderContainer.css';

export interface RenderContainerProps {
  blendFile: File,
  scenes: Array<string>,
  startFrame: number,
  endFrame: number,
  enabled: boolean,
  status: string
}

const RenderContainer: React.FC<RenderContainerProps> = (props) => {

  return (
    <>


      <IonGrid>
        <IonRow>
          <IonCol size="1">
            <IonToggle checked={true}></IonToggle>
          </IonCol>
          <IonCol size="1">
            {(props.status==='pending') &&<IonIcon size="large" icon={timeOutline}></IonIcon>}
            {(props.status==='computing') &&<IonIcon size="large" icon={hardwareChipOutline}></IonIcon>}
          </IonCol>
          <IonCol size="3">
            <IonLabel>{props.blendFile.name}</IonLabel>
          </IonCol>
          <IonCol >
            <IonSelect placeholder="Scene">
              {props.scenes.map((value, index) =>
                <IonSelectOption key={index} value={value}>{value}</IonSelectOption>
              )}
            </IonSelect>
          </IonCol>
          <IonCol>
            <IonInput placeholder={props.startFrame.toString()}></IonInput>
          </IonCol>
          <IonCol>
            <IonInput placeholder={props.endFrame.toString()}></IonInput>
          </IonCol>
          <IonCol>
            <IonIcon size="large" icon={informationCircleOutline}></IonIcon>
          </IonCol>
        </IonRow>
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
