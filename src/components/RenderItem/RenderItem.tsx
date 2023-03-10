import React from 'react';
import { trashOutline, alertCircleOutline, checkmarkCircleOutline, cogOutline, pause, refreshOutline, chevronForward, warningOutline } from 'ionicons/icons';
import { IonCol, IonGrid, IonInput, IonRow, IonToggle, IonProgressBar, IonLabel, IonSelect, IonSelectOption, IonIcon, IonItem, IonReorder, IonPopover, IonContent } from '@ionic/react';
import { RenderItemData } from '../../data/RenderItemData';
import * as Services from '../../services/services';
import * as CONST from '../../constants';


import './RenderItem.css';
import * as Utils from '../../utils/utils';

export interface RenderItemProps {
  data: RenderItemData;
  onSceneChange: Function;
  onOutputFileChange: Function;
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

const RenderItem: React.FC<RenderItemProps> = (props) => {

  const firstRowElement = React.useRef<HTMLIonRowElement>(null);
  const secondRowElement = React.useRef<HTMLIonRowElement>(null);

  const setOutputPath = (event: React.MouseEvent) => {
    Services.ShowSaveDialog(props.data.sceneData.filepath).then(function (res: any) {
      console.log(res);
      if (!res.canceled)
        props.onOutputFileChange(res.filePath);
    }).catch(function (err: any) {
      console.error(err);
    });
  }

  const onClick = (event: React.MouseEvent) => {
    if (event.target === firstRowElement.current || event.target === secondRowElement.current) {
      event.preventDefault();
      event.stopPropagation();
      if (!props.data.isRendering && !props.data.isPaused)
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
            className={(props.data.isInitializing) ? 'locked' : (props.data.enabled ? ((props.data.isRendering || props.data.isPaused) ? 'busy' : '') : 'disabled')}
          >
            <IonCol size="2" class="ion-justify-content-around">
              <IonIcon className={props.data.expanded ? 'expand-icon opened' : 'expand-icon closed'} onClick={() => props.onExpand()} size="small" icon={chevronForward}></IonIcon>
              {(props.data.isPending || props.data.isInitializing) &&
                <IonToggle
                  color={props.data.selected ? 'light' : 'primary'}
                  checked={props.data.enabled}
                  onIonChange={(event) => props.onToggleChange(event.target.value)}
                ></IonToggle>
              }

              {(props.data.isPaused) && <IonIcon size="small" color="warning" icon={pause}></IonIcon>}
              {(!props.data.isPaused && props.data.isRendering) && <IonIcon className="renderingIcon" color="warning" size="small" icon={cogOutline}></IonIcon>}
              {(!props.data.isPaused && props.data.hasFailed) && <IonIcon color="danger" size="small" icon={alertCircleOutline}></IonIcon>}
              {(!props.data.isPaused && props.data.isDone) && <IonIcon color="success" size="small" icon={checkmarkCircleOutline}></IonIcon>}

              <IonIcon className={(props.data.isRendering || props.data.isPaused) ? 'icon-button disabled' : 'icon-button'} onClick={() => props.onRefresh()} size="small" icon={refreshOutline}></IonIcon>

            </IonCol>

            <IonCol size="3" class="ion-justify-content-start file-name">
              <IonLabel>{props.data.blendFileName}</IonLabel>
            </IonCol>
            <IonCol size="2" class="ion-justify-content-start">
              <IonItem>
                <IonSelect
                  disabled={!(props.data.isReady)}
                  placeholder="Scene"
                  interface="popover"
                  onIonChange={(event) => props.onSceneChange(event.target.value)}
                  value={props.data.scene}>
                  {!props.data.isInitializing && props.data.blendFileData.sceneNames.map((sceneName, index) =>
                    <IonSelectOption key={index} value={sceneName}>{sceneName}</IonSelectOption>
                  )}
                </IonSelect>
              </IonItem>
            </IonCol>
            <IonCol size="2">
              <IonItem
                className={`${framesAreValid && 'ion-valid'} ${framesAreValid === false && 'ion-invalid'}`}
                fill={(props.data.isReady) ? 'solid' : undefined}>
                <IonInput
                  disabled={!(props.data.isReady)}
                  type="number"
                  placeholder={props.data.sceneData.start.toString()}
                  onIonChange={(event) => props.onStartFrameChange(event.target.value)}
                  value={props.data.startFrame}>
                </IonInput>

              </IonItem>
            </IonCol>
            <IonCol size="2">
              <IonItem
                className={`${framesAreValid && 'ion-valid'} ${framesAreValid === false && 'ion-invalid'}`}
                fill={(props.data.isReady) ? 'solid' : undefined}>
                <IonInput
                  disabled={!(props.data.isReady)}
                  type="number"
                  placeholder={props.data.sceneData.end.toString()}
                  onIonChange={(event) => props.onEndFrameChange(event.target.value)}
                  value={props.data.endFrame}>
                </IonInput>
              </IonItem>
            </IonCol>
            <IonCol size="1" class="ion-justify-content-end">
              {(!props.data.isPaused && !props.data.isRendering) &&
                <IonIcon className='icon-button' onClick={() => props.onDelete()} size="small" icon={trashOutline}></IonIcon>
              }
            </IonCol>
          </IonRow>

          {!props.data.isInitializing &&
            <IonRow
              ref={secondRowElement}
              onClick={(event) => onClick(event)}
              className={props.data.expanded ? 'info opened' : 'info closed'}>
              <IonCol size='1' class="ion-justify-content-center">{CONST.ENGINE_SHORT_NAMES[props.data.sceneData.engine]}</IonCol>
              <IonCol size='1' class="ion-justify-content-center">{props.data.sceneData.resolution_x}x{props.data.sceneData.resolution_y}</IonCol>
              <IonCol size='1' class="ion-justify-content-center">{props.data.sceneData.fps} fps</IonCol>
              <IonCol size='1' class="ion-justify-content-center">{props.data.sceneData.film_transparent ? 'Transparent' : 'Not transparent'}</IonCol>
              <IonCol size='1' class="ion-justify-content-center">{props.data.sceneData.file_format} ({props.data.sceneData.color})</IonCol>
              <IonCol size='7' class="ion-justify-content-start">
                &nbsp;<a
                  id="context-menu-trigger"
                  onClick={setOutputPath}
                  href="#1"
                  className={props.data.outputFilePathExists ? '' : 'warning'}
                >{Utils.strippedPath(props.data.outputFilePath, 73)}</a>

                {!props.data.outputFilePathExists &&
                  <><IonIcon id={'warning-output-' + props.index} className='icon-button' size="small" icon={warningOutline}></IonIcon>
                    <IonPopover trigger={'warning-output-' + props.index} triggerAction="click">
                      <IonContent class="ion-padding">Output Folder doesn't exists but may be created when rendering</IonContent>
                    </IonPopover>
                  </>
                }
              </IonCol>
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

export default RenderItem;
