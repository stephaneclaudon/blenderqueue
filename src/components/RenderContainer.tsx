import React, { useState, useEffect, Children } from 'react';
import { informationCircleOutline, timeOutline, hardwareChipOutline, trashOutline } from 'ionicons/icons';
import { IonItem, IonCol, IonGrid, IonInput, IonRow, IonToggle, IonProgressBar, IonLabel, IonSelect, IonSelectOption, IonIcon } from '@ionic/react';
import { RenderItemData } from '../data/RenderItemData';

import './RenderContainer.css';

export interface RenderContainerProps {
  data: RenderItemData;
  onSceneChange: Function;
  onStartFrameChange: Function;
  onEndFrameChange: Function;
  onToggleChange: Function;
  onDelete: Function;
  index: number;
}

const debug: boolean = true;

const RenderContainer: React.FC<RenderContainerProps> = (props) => {
 
  const deleteItem = () => {
    props.onDelete();
  };

  return (
    <>
      <IonGrid className={'renderItem'}>
        <IonRow className={props.data.initializing ? 'locked' : (props.data.enabled ? '' : 'disabled')}>
          <IonCol size="1" className='toggle'>
            <IonToggle checked={props.data.enabled}
              onIonChange={(event) => props.onToggleChange(event.target.value)}
            ></IonToggle>
          </IonCol>
          <IonCol size="1">
            {(props.data.status === 'pending') && <IonIcon size="large" icon={timeOutline}></IonIcon>}
            {(props.data.status === 'computing') && <IonIcon size="large" icon={hardwareChipOutline}></IonIcon>}
          </IonCol>
          <IonCol size="3">
            <IonLabel>{props.data.blendFile.name}</IonLabel>
          </IonCol>
          <IonCol>
            <IonSelect
              placeholder="Scene"
              onIonChange={(event) => props.onSceneChange(event.target.value)}
              value={props.data.scene}>
              {!props.data.initializing && props.data.blendFileData.sceneNames.map((sceneName, index) =>
                <IonSelectOption key={index} value={sceneName}>{sceneName}</IonSelectOption>
              )}
            </IonSelect>
          </IonCol>
          <IonCol>
            <IonInput
              placeholder={props.data.startFrame.toString()}
              onIonChange={(event) => props.onStartFrameChange(event.target.value)}
              value={props.data.startFrame}>
            </IonInput>
          </IonCol>
          <IonCol>
            <IonInput
              placeholder={props.data.endFrame.toString()}
              onIonChange={(event) => props.onEndFrameChange(event.target.value)}
              value={props.data.endFrame}>

            </IonInput>
          </IonCol>
          <IonCol>
            <IonIcon size="large" icon={informationCircleOutline}></IonIcon>
          </IonCol>
          <IonCol>
            <IonIcon className='delete' onClick={deleteItem} size="large" icon={trashOutline}></IonIcon>
          </IonCol>
          <IonCol>
            <span>{props.index}</span>
          </IonCol>
        </IonRow>

        {props.data.initializing &&
          <IonRow>
            <IonProgressBar type={props.data.initializing ? 'indeterminate' : 'determinate'}></IonProgressBar>
          </IonRow>
        }

        {debug &&
          <IonRow>
            <p>{props.data.commandArgs.join(' ')}</p>
          </IonRow>
        }
      </IonGrid>
    </>
  );
};

export default RenderContainer;
