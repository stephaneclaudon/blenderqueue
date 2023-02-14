import React, { useEffect, useRef, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonList, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonImg, useIonAlert, IonReorderGroup, ItemReorderEventDetail, IonReorder, IonItem, setupIonicReact } from '@ionic/react';
import RenderContainer from '../components/RenderContainer';
import InfosContainer from '../components/Infos/InfosContainer';
import { RenderItemData } from '../data/RenderItemData';
import { subscribe, unsubscribe } from '../events/events';
import { GetData, RenderJob } from '../services/services';
import { cog, pause, play, playOutline, stopSharp } from 'ionicons/icons';

import { useHotkeys } from 'react-hotkeys-hook'
import { isHotkeyPressed } from 'react-hotkeys-hook'

import './Home.css';
import Settings from '../components/Settings/Settings';
import DragDrop from '../components/DragDrop/DragDrop';


let canRender: boolean = false;

const Home: React.FC = () => {

  const [init, setInit] = useState(true);

  const openSettingsBtn = React.useRef<HTMLIonIconElement>(null);

  const [renderItems, setRenderItems] = useState(new Array<RenderItemData>());
  const [currentRenderId, setCurrentRenderId] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [currentRenderJob, setCurrentRenderJob] = useState<RenderJob>();
  const [errorAlert] = useIonAlert();

  const onFilesDroped = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      let file: File = files[i];
      if (!file) return;
      let renderItem: RenderItemData = new RenderItemData();
      renderItem.init(file, () => {
        onRenderItemChange(renderItem);
      }, () => {
        onRenderItemChange(renderItem);
      });
      renderItems.push(renderItem);
    }

    setRenderItems([
      ...renderItems
    ]);
  };

  const onRenderItemChange = (item: RenderItemData) => {
    item.updateCommand();
    setRenderItems([...renderItems]);
  };

  const onRenderItemExpand = (item: RenderItemData) => {
    item.expanded = !item.expanded;
    setRenderItems([...renderItems]);
  };

  const refreshItem = (item: RenderItemData) => {
    item.reset(() => {
      onRenderItemChange(item);
    }, () => {
      onRenderItemChange(item);
    });
    onRenderItemChange(item);
  };

  const onRenderItemDelete = (id: number) => {
    renderItems.splice(id, 1);
    setRenderItems([...renderItems]);
  };


  const startRender = (renderId: number) => {
    let render: RenderJob = new RenderJob(renderItems[renderId]);
    render.onStop = onRenderStop;
    render.onClose = onRenderClose;
    render.onError = onRenderError;
    render.start();
    setCurrentRenderJob(render);
  }

  const onRenderStop = () => {
    setPaused(false);
    setCurrentRenderJob(undefined);
    setCurrentRenderId(-1);
    setRenderItems([...renderItems]);
  };

  const onRenderClose = (code: number) => {
    if (hasNextRenderableItem(currentRenderId)) {
      setCurrentRenderId(getNextRenderableItemId(currentRenderId));
    }
    else {
      setCurrentRenderJob(undefined);
      setCurrentRenderId(-1);
    }
    setRenderItems([...renderItems]);
  };

  const onRenderError = (error: string) => {
    onRenderClose(0);
    errorAlert({
      header: 'Render Error',
      subHeader: 'Blender renderer has failed',
      message: error,
      buttons: ['CLOSE']
    });
  };

  let hasNextRenderableItem = (startIndex: number): boolean => {
    let found = false;
    renderItems.map((item, key) => {
      if (key > startIndex && item.isReady && !found) {
        found = true;
      }
    });
    return found;
  }

  const getNextRenderableItemId = (startIndex: number): number => {
    let itemIndex = -1;
    renderItems.map((item: RenderItemData, key) => {
      if (key > startIndex && item.enabled && item.isReady && itemIndex < 0)
        itemIndex = key;
    });
    return itemIndex;
  }

  const addSelectedItem = (index: number) => {
    if (isHotkeyPressed(['shift'])) {
      let firstSelected = renderItems.findIndex((item: RenderItemData) => item.selected);
      let lastSelected = renderItems.length - 1 - [...renderItems].reverse().findIndex((item: RenderItemData) => item.selected);

      let min = Math.min(index, firstSelected);
      let max = Math.max(index, lastSelected);

      for (let ind = min; ind < max + 1; ind++) {
        renderItems[ind].selected = true;
      }
    } else if (!(isHotkeyPressed(['meta']) || isHotkeyPressed(['control']))) {
      renderItems.map((item: RenderItemData) => {
        item.selected = false;
      });
    }
    renderItems[index].selected = true;

    setRenderItems([...renderItems]);
  };

  const duplicateSelectedItems = () => {
    renderItems.map((item: RenderItemData, index: number) => {
      if (item.selected) {
        item.selected = false;
        let clone: RenderItemData = new RenderItemData();
        Object.assign(clone, item);
        clone.selected = true;
        clone.resetUuid();
        if (!clone.isPending)
          refreshItem(clone);
        renderItems.push(clone);
      }
    });

    setRenderItems([...renderItems]);
  };

  const deleteSelectedItems = () => {
    let newItems = renderItems.filter((item: RenderItemData) => (!item.selected || item.isRendering || item.isPaused));
    setRenderItems([...newItems]);
  };

  const deselectItems = () => {
    renderItems.map((item: RenderItemData, index: number) => {
      item.selected = false;
    });

    setRenderItems([...renderItems]);
  };

  const selectAllItems = () => {
    renderItems.map((item: RenderItemData, index: number) => {
      item.selected = true;
    });
    setRenderItems([...renderItems]);
  };

  const onErrorAlert = (data: any) => {
    errorAlert({
      header: data.detail.header,
      subHeader: data.detail.subHeader,
      message: data.detail.message,
      buttons: ['CLOSE'],
    });
  };

  const onSettingsUpdated = () => {
    console.log("onSettingsUpdated", GetData());
  };

  const handleReorder = (event: CustomEvent<ItemReorderEventDetail>) => {
    let newItems = event.detail.complete(renderItems);
    console.log(newItems);
    setRenderItems([...newItems]);
  }
  const onBlenderExeError = (event: any, str: string) => {
    errorAlert({
      header: 'Settings Error',
      subHeader: 'Can\'t find Blender',
      message: str,
      buttons: ['CLOSE']
    });
    openSettingsBtn.current?.click();
  }


  /* ------------------------- */
  /* -----    EFFECTS    ----- */
  /* ------------------------- */

  useHotkeys('mod+d', () => duplicateSelectedItems(), { preventDefault: true }, [renderItems]);
  useHotkeys('mod+a', () => selectAllItems(), { preventDefault: true }, [renderItems]);
  useHotkeys(['delete', 'backspace'], () => deleteSelectedItems(), { preventDefault: true }, [renderItems]);

  useEffect(() => {
    if (init) {
      //@ts-ignore
      if (window.electronAPI) {
        //@ts-ignore
        window.electronAPI.blenderExecutablePathError(onBlenderExeError);
      }
      setInit(false);
    }
  }, [init]);

  useEffect(() => {
    if (currentRenderId > -1)
      startRender(currentRenderId);
  }, [currentRenderId]);


  let renderAvailable = hasNextRenderableItem(currentRenderId);
  canRender = renderAvailable && !(currentRenderJob && currentRenderJob.running);


  return (

    <IonPage>
      <DragDrop onDrop={onFilesDroped}></DragDrop>
      <IonHeader id="header">
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol size="1"><IonImg src="/assets/img/blender_logo_no_socket_white.png"></IonImg></IonCol>

              <IonCol size="11" class="ion-justify-content-end">

                <IonIcon ref={openSettingsBtn} id="open-settings" size="large" icon={cog} className={(currentRenderJob && currentRenderJob.running) ? 'disabled' : ''}></IonIcon>
                <Settings onSettingsUpdated={onSettingsUpdated}></Settings>


                {(currentRenderJob && currentRenderJob.running && !currentRenderJob.paused) &&
                  <IonButton onClick={() => {
                    setPaused(true);
                    currentRenderJob.pauseRender();
                  }} color="primary">
                    <IonIcon icon={pause}></IonIcon>
                    Pause
                  </IonButton>
                }
                {(currentRenderJob && currentRenderJob.paused) &&
                  <IonButton onClick={() => {
                    setPaused(false);
                    currentRenderJob.resumeRender();
                  }} color="warning">
                    <IonIcon icon={play}></IonIcon>
                    Resume
                  </IonButton>
                }
                {(currentRenderJob && currentRenderJob.running) &&
                  <IonButton onClick={() => {
                    currentRenderJob?.stopRender()
                  }} color="danger">
                    <IonIcon icon={stopSharp}></IonIcon>
                    Stop
                  </IonButton>
                }
                {!(currentRenderJob && currentRenderJob.running) &&
                  <IonButton disabled={!canRender} onClick={() => setCurrentRenderId(getNextRenderableItemId(currentRenderId))} color="primary">
                    <IonIcon icon={playOutline}></IonIcon>
                    Render
                  </IonButton>
                }

              </IonCol>
            </IonRow>
          </IonGrid>


        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen id="content">
        {(renderItems.length > 0)
          ? <IonList id='queue' onClick={() => deselectItems()}>
            <IonReorderGroup key={'IonReorderGroup'} disabled={(currentRenderJob && currentRenderJob.running)} onIonItemReorder={handleReorder}>
              {renderItems.map((renderItem: RenderItemData, index: number) =>

                <RenderContainer
                  onSelect={() => addSelectedItem(index)}
                  onExpand={() => onRenderItemExpand(renderItem)}
                  onRefresh={() => refreshItem(renderItem)}
                  data={renderItem}
                  key={index}
                  onDelete={() => onRenderItemDelete(index)}
                  onToggleChange={() => {
                    renderItem.enabled = !renderItem.enabled;
                    if (renderItem.enabled)
                      renderItem.status = RenderItemData.STATUS_PENDING;
                    onRenderItemChange(renderItem);
                  }}
                  onSceneChange={(sceneName: string) => {
                    renderItem.scene = sceneName;
                    onRenderItemChange(renderItem);
                  }}
                  onStartFrameChange={(frame: number) => {
                    renderItem.startFrame = frame;
                    onRenderItemChange(renderItem);
                  }}
                  onEndFrameChange={(frame: number) => {
                    renderItem.endFrame = frame;
                    onRenderItemChange(renderItem);
                  }}
                  index={index} />
              )}
            </IonReorderGroup>
          </IonList>
          : <div id="instructions">Drop Blender project files here, click "Render" to start rendering.</div>
        }

        {currentRenderJob && currentRenderJob.running &&
          <InfosContainer renderJob={currentRenderJob} />
        }
      </IonContent>
    </IonPage >
  );
};

export default Home;
