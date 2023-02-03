import React, { useState, useEffect, Children } from 'react';
import { informationCircleOutline, timeOutline, hardwareChipOutline, trashOutline, alertCircleOutline, checkmarkCircleOutline, cogOutline, pauseOutline, pause, refreshOutline } from 'ionicons/icons';
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
  onRefresh: Function;
  onSelect: Function;
  index: number;
  paused: boolean;
  selected: boolean;
}

const debug: boolean = false;

const RenderContainer: React.FC<RenderContainerProps> = (props) => {
  const rowElement = React.useRef<HTMLIonRowElement>(null);

  const onClick = (event: React.MouseEvent) => {
    if (event.target === rowElement.current) {
      event.preventDefault();
      event.stopPropagation();
      props.onSelect();
    }
  }

  return (
    <>
      <IonGrid className={props.selected ? 'renderItem selected' : 'renderItem'}>
        <IonRow
          ref={rowElement}
          className={(props.data.initializing) ? 'locked' : (props.data.enabled ? '' : 'disabled')}
          onClick={(event) => onClick(event)}>
          <IonCol size="1" className='toggle'>
            {!(props.data.isDone || props.data.isRendering || props.data.hasFailed) &&
              <IonToggle
                color={props.selected ? 'light' : 'primary'}
                checked={props.data.enabled}
                onIonChange={(event) => props.onToggleChange(event.target.value)}
              ></IonToggle>
            }
            {(props.data.hasFailed) &&
              <IonIcon className='delete' onClick={() => props.onRefresh()} size="large" icon={refreshOutline}></IonIcon>
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
            <IonLabel>{props.data.blendFileName}</IonLabel>
          </IonCol>
          <IonCol>
            <IonSelect
              disabled={(props.data.isDone || props.data.isRendering || props.data.hasFailed)}
              placeholder="Scene"
              onIonChange={(event) => props.onSceneChange(event.target.value)}
              value={props.data.scene}>
              {!props.data.initializing && props.data.blendFileData.sceneNames.map((sceneName, index) =>
                <IonSelectOption key={index} value={sceneName}>{sceneName}</IonSelectOption>
              )}
            </IonSelect>
          </IonCol>
          <IonCol>
            {!(props.data.isReady)
              ? <span>{props.data.startFrame}</span>
              : <IonInput
                placeholder={props.data.startFrame.toString()}
                onIonChange={(event) => props.onStartFrameChange(event.target.value)}
                value={props.data.startFrame}>
              </IonInput>
            }

          </IonCol>
          <IonCol>
            {!(props.data.isReady)
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
            {!props.data.isRendering &&
              <IonIcon className='delete' onClick={() => props.onDelete()} size="large" icon={trashOutline}></IonIcon>
            }
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
