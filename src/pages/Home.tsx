import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonList, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonImg, useIonAlert, IonReorderGroup, ItemReorderEventDetail } from '@ionic/react';
import RenderItem from '../components/RenderItem/RenderItem';
import InfosContainer from '../components/Infos/InfosContainer';
import { RenderItemData } from '../data/RenderItemData';
import { RenderJob } from '../services/services';
import { cog, pause, play, playOutline, stopSharp } from 'ionicons/icons';

import { useHotkeys } from 'react-hotkeys-hook'
import { isHotkeyPressed } from 'react-hotkeys-hook'

import './Home.css';
import Settings from '../components/Settings/Settings';
import DragDrop from '../components/DragDrop/DragDrop';
import { BlenderQueueData } from '../data/SettingsData';


let canRender: boolean = false;
let renderJob = new RenderJob();

const Home: React.FC = () => {

  const [init, setInit] = useState(true);

  const openSettingsBtn = React.useRef<HTMLIonIconElement>(null);

  const [renderItems, setRenderItems] = useState(new Array<RenderItemData>());
  const [currentRenderId, setCurrentRenderId] = useState(-1);
  const [errorAlert] = useIonAlert();

  const onFilesDroped = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      let file: File = files[i];
      if (!file) return;
      let renderItem: RenderItemData = new RenderItemData();
      renderItem.init(file, () => {
        onRenderItemChange(renderItem);
      }, (error:string) => {
        errorAlert({
          header: 'Error',
          subHeader: 'Get infos from blend file',
          message: error,
          buttons: ['CLOSE']
        });
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
    }, (error:string) => {
      errorAlert({
        header: 'Error',
        subHeader: 'Get infos from blend file',
        message: error,
        buttons: ['CLOSE']
      });
      onRenderItemChange(item);
    });
    onRenderItemChange(item);
  };

  const onRenderItemDelete = (id: number) => {
    renderItems.splice(id, 1);
    setRenderItems([...renderItems]);
  };


  const startRender = (renderId: number) => {
    renderJob.init(renderItems[renderId]);
    renderJob.start();
    setRenderItems([...renderItems]);
  }

  const onRenderStop = () => {
    setCurrentRenderId(-1);
    setRenderItems([...renderItems]);
  };

  const onRenderClose = (code: number) => {
    renderJob = new RenderJob();
    if (hasNextRenderableItem(currentRenderId)) {
      setCurrentRenderId(getNextRenderableItemId(currentRenderId));
    }
    else {
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

  const onSettingsUpdated = () => {
    console.log("onSettingsUpdated");
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

  const onSettingsLoaded = (settings: BlenderQueueData) => {
    for (let index = 0; index < settings.session.length; index++) {
      let renderItem: RenderItemData = new RenderItemData();
      Object.assign(renderItem, settings.session[index]);
      renderItem.deserializeData();
      renderItem.resetStatus();
      renderItem.updateCommand();
      renderItems.push(renderItem);
    }
    setRenderItems([...renderItems]);
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

  renderJob.onStop = onRenderStop;
  renderJob.onClose = onRenderClose;
  renderJob.onError = onRenderError;

  let renderAvailable = hasNextRenderableItem(currentRenderId);
  canRender = renderAvailable && !(renderJob && renderJob.running);











  return (

    <IonPage>
      <DragDrop onDrop={onFilesDroped}></DragDrop>
      <IonHeader id="header">
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol size="1"><IonImg src="/assets/img/blender_logo_no_socket_white.png"></IonImg></IonCol>

              <IonCol size="11" class="ion-justify-content-end">

                <IonIcon ref={openSettingsBtn} id="open-settings" size="large" icon={cog} className={(renderJob && renderJob.running) ? 'disabled' : ''}></IonIcon>
                <Settings onSettingsUpdated={onSettingsUpdated} onSettingsLoaded={onSettingsLoaded} session={renderItems}></Settings>


                {(renderJob && renderJob.running && !renderJob.paused) &&
                  <IonButton onClick={() => {
                    renderJob.pauseRender();
                  }} color="primary">
                    <IonIcon icon={pause}></IonIcon>
                    Pause
                  </IonButton>
                }
                {(renderJob && renderJob.paused) &&
                  <IonButton onClick={() => {
                    renderJob.resumeRender();
                  }} color="warning">
                    <IonIcon icon={play}></IonIcon>
                    Resume
                  </IonButton>
                }
                {(renderJob && renderJob.running) &&
                  <IonButton onClick={() => {
                    renderJob?.stopRender()
                  }} color="danger">
                    <IonIcon icon={stopSharp}></IonIcon>
                    Stop
                  </IonButton>
                }
                {!(renderJob && renderJob.running) &&
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
            <IonReorderGroup key={'IonReorderGroup'} disabled={(renderJob && renderJob.running)} onIonItemReorder={handleReorder}>
              {renderItems.map((renderItem: RenderItemData, index: number) =>

                <RenderItem
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
          : <div id="instructions"><div>Drop Blender project files here, click "Render" to start rendering.</div></div>
        }

        <InfosContainer renderJob={renderJob} />
      </IonContent>
    </IonPage >
  );
};

export default Home;
