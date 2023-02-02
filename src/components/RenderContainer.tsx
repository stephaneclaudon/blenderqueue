import React, { useState, useEffect, Children } from 'react';
import { informationCircleOutline, timeOutline, hardwareChipOutline, trashOutline, alertCircleOutline, checkmarkCircleOutline, cogOutline, pauseOutline, pause } from 'ionicons/icons';
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
  paused: boolean;
}

const debug: boolean = false;

const RenderContainer: React.FC<RenderContainerProps> = (props) => {

  const deleteItem = () => {
    props.onDelete();
  };

  return (
    <>
      <IonGrid class="renderItem">
        <IonRow className={(props.data.initializing) ? 'locked' : (props.data.enabled ? '' : 'disabled')}>
          <IonCol size="1" className='toggle'>
            {!(props.data.isDone || props.data.isRendering) &&
              <IonToggle
                checked={props.data.enabled}
                onIonChange={(event) => props.onToggleChange(event.target.value)}
              ></IonToggle>
            }
          </IonCol>
          <IonCol size="1">
            {(props.paused) && <IonIcon size="large" color="warning" icon={pause}></IonIcon>}

            {(!props.paused && props.data.status === RenderItemData.STATUS_PENDING) && <IonIcon size="large" icon={timeOutline}></IonIcon>}
            {(!props.paused && props.data.status === RenderItemData.STATUS_RENDERING) && <IonIcon className="renderingIcon" color="warning" size="large" icon={cogOutline}></IonIcon>}
            {(!props.paused && props.data.status === RenderItemData.STATUS_ERROR) && <IonIcon color="danger" size="large" icon={alertCircleOutline}></IonIcon>}
            {(!props.paused && props.data.status === RenderItemData.STATUS_DONE) && <IonIcon color="success" size="large" icon={checkmarkCircleOutline}></IonIcon>}
          </IonCol>
          <IonCol size="3">
            <IonLabel>{props.data.blendFile.name}</IonLabel>
          </IonCol>
          <IonCol>
            <IonSelect
              disabled={(props.data.isDone || props.data.isRendering)}
              placeholder="Scene"
              onIonChange={(event) => props.onSceneChange(event.target.value)}
              value={props.data.scene}>
              {!props.data.initializing && props.data.blendFileData.sceneNames.map((sceneName, index) =>
                <IonSelectOption key={index} value={sceneName}>{sceneName}</IonSelectOption>
              )}
            </IonSelect>
          </IonCol>
          <IonCol>
            {(props.data.isDone || props.data.isRendering)
              ? <span>{props.data.startFrame}</span>
              : <IonInput
                placeholder={props.data.startFrame.toString()}
                onIonChange={(event) => props.onStartFrameChange(event.target.value)}
                value={props.data.startFrame}>
              </IonInput>
            }


          </IonCol>
          <IonCol>
            {(props.data.isDone || props.data.isRendering)
              ? <span>{props.data.endFrame}</span>
              : <IonInput
                placeholder={props.data.endFrame.toString()}
                onIonChange={(event) => props.onEndFrameChange(event.target.value)}
                value={props.data.endFrame}>

              </IonInput>
            }
          </IonCol>
          <IonCol>
            <IonIcon size="large" icon={informationCircleOutline}></IonIcon>
          </IonCol>
          <IonCol>
            <IonIcon className='delete' onClick={deleteItem} size="large" icon={trashOutline}></IonIcon>
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
