import React, { useState } from 'react';
import { timeOutline, trashOutline, alertCircleOutline, checkmarkCircleOutline, cogOutline, pauseOutline, pause, refreshOutline, chevronForward } from 'ionicons/icons';
import { IonCol, IonGrid, IonInput, IonRow, IonToggle, IonProgressBar, IonLabel, IonSelect, IonSelectOption, IonIcon, IonPopover, IonContent, IonItem, IonNote, IonReorder } from '@ionic/react';
import { RenderItemData } from '../data/RenderItemData';
import * as Services from '../services/services';


import './RenderContainer.css';
import * as Utils from '../utils/utils';

export interface RenderContainerProps {
  data: RenderItemData;
  onSceneChange: Function;
  onStartFrameChange: Function;
  onEndFrameChange: Function;
  onToggleChange: Function;
  onDelete: Function;
  onRefresh: Function;
  onSelect: Function;
  onExpand: Function;
  index: number;
}

const debug: boolean = false;
let framesAreValid: boolean = false;

const RenderContainer: React.FC<RenderContainerProps> = (props) => {

  const firstRowElement = React.useRef<HTMLIonRowElement>(null);
  const secondRowElement = React.useRef<HTMLIonRowElement>(null);


  const onClick = (event: React.MouseEvent) => {
    if (event.target === firstRowElement.current || event.target === secondRowElement.current) {
      event.preventDefault();
      event.stopPropagation();
      props.onSelect();
    }
  }

  framesAreValid = props.data.endFrame >= props.data.startFrame;


  return (
    <>
      <IonItem
        class="ion-no-padding item-multiple-inputs">
        <IonGrid className={props.data.selected ? 'renderItem selected' : 'renderItem'}>
          <IonRow
            ref={firstRowElement}
            onClick={(event) => onClick(event)}
            className={(props.data.isInitializing) ? 'locked' : (props.data.enabled ? '' : 'disabled')}
          >
            <IonCol size="2" class="ion-justify-content-evenly">
              <IonIcon className={props.data.expanded ? 'expand-icon opened' : 'expand-icon closed'} onClick={() => props.onExpand()} size="large" icon={chevronForward}></IonIcon>
              {(props.data.isPending) &&
                <IonToggle
                  color={props.data.selected ? 'light' : 'primary'}
                  checked={props.data.enabled}
                  onIonChange={(event) => props.onToggleChange(event.target.value)}
                ></IonToggle>
              }
              {!(props.data.isPending) &&
                <IonIcon className={(props.data.hasFailed || props.data.isDone) ? 'icon-button' : 'icon-button hidden'} onClick={() => props.onRefresh()} size="large" icon={refreshOutline}></IonIcon>
              }



              {(props.data.isPaused) && <IonIcon size="large" color="warning" icon={pause}></IonIcon>}
              {(!props.data.isPaused && props.data.isPending) && <IonIcon size="large" icon={timeOutline}></IonIcon>}
              {(!props.data.isPaused && props.data.isRendering) && <IonIcon className="renderingIcon" color="warning" size="large" icon={cogOutline}></IonIcon>}
              {(!props.data.isPaused && props.data.hasFailed) && <IonIcon color="danger" size="large" icon={alertCircleOutline}></IonIcon>}
              {(!props.data.isPaused && props.data.isDone) && <IonIcon color="success" size="large" icon={checkmarkCircleOutline}></IonIcon>}


            </IonCol>

            <IonCol size="3" class="ion-justify-content-start file-name">
              <IonLabel>{props.data.blendFileName}</IonLabel>
            </IonCol>
            <IonCol size="2" class="ion-justify-content-start">
              <IonSelect
                disabled={(props.data.isDone || props.data.isRendering || props.data.hasFailed)}
                placeholder="Scene"
                onIonChange={(event) => props.onSceneChange(event.target.value)}
                value={props.data.scene}>
                {!props.data.isInitializing && props.data.blendFileData.sceneNames.map((sceneName, index) =>
                  <IonSelectOption key={index} value={sceneName}>{sceneName}</IonSelectOption>
                )}
              </IonSelect>
            </IonCol>
            <IonCol size="2">
              <IonItem
                className={`${framesAreValid && 'ion-valid'} ${framesAreValid === false && 'ion-invalid'}`}
                fill={(props.data.isReady) ? 'solid' : undefined}>
                {!(props.data.isReady)
                  ? <span>{props.data.startFrame}</span>
                  : <IonInput
                    type="number"
                    placeholder={props.data.sceneData.start.toString()}
                    onIonChange={(event) => props.onStartFrameChange(event.target.value)}
                    value={props.data.startFrame}>
                  </IonInput>
                }
              </IonItem>
            </IonCol>
            <IonCol size="2">
              <IonItem
                className={`${framesAreValid && 'ion-valid'} ${framesAreValid === false && 'ion-invalid'}`}
                fill={(props.data.isReady) ? 'solid' : undefined}>
                {!(props.data.isReady)
                  ? <span>{props.data.endFrame}</span>
                  : <IonInput
                    type="number"
                    placeholder={props.data.sceneData.end.toString()}
                    onIonChange={(event) => props.onEndFrameChange(event.target.value)}
                    value={props.data.endFrame}>
                  </IonInput>
                }
              </IonItem>
            </IonCol>
            <IonCol size="1" class="ion-justify-content-end">
              {(!props.data.isPaused && !props.data.isRendering) &&
                <IonIcon className='icon-button' onClick={() => props.onDelete()} size="large" icon={trashOutline}></IonIcon>
              }
            </IonCol>
          </IonRow>


          {!props.data.isInitializing &&
            <IonRow
              ref={secondRowElement}
              onClick={(event) => onClick(event)}
              className={props.data.expanded ? 'info opened' : 'info closed'}>
              <IonCol size='2' class="ion-justify-content-start">{props.data.sceneData.engine}</IonCol>
              <IonCol size='2' class="ion-justify-content-start">{props.data.sceneData.resolution_x}x{props.data.sceneData.resolution_y}px</IonCol>
              <IonCol size='1' class="ion-justify-content-start">{props.data.sceneData.file_format}</IonCol>
              <IonCol size='1' class="ion-justify-content-start">{props.data.sceneData.film_transparent ? 'Alpha' : 'No alpha'}</IonCol>
              <IonCol size='6' class="ion-justify-content-start">&nbsp;<a onClick={() => Services.OpenFolder(props.data.sceneData.filepath)} href="#">{Utils.strippedPath(props.data.sceneData.filepath)}</a></IonCol>
            </IonRow>
          }

          {props.data.isInitializing &&
            <IonRow>
              <IonProgressBar type={props.data.isInitializing ? 'indeterminate' : 'determinate'}></IonProgressBar>
            </IonRow>
          }

          {debug &&
            <IonRow>
              <p>{props.data.commandArgs.join(' ')}</p>
            </IonRow>
          }
        </IonGrid>
        <IonReorder slot="end" ></IonReorder>
      </IonItem>
    </>
  );
};

export default RenderContainer;
