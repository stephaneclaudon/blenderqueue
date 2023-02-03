import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonProgressBar, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonImg, useIonAlert } from '@ionic/react';
import RenderContainer from '../components/RenderContainer';
import InfosContainer from '../components/Infos/InfosContainer';
import { RenderItemData } from '../data/RenderItemData';
import './Home.css';
import { subscribe, unsubscribe } from '../events/events';
import { RenderJob } from '../services/services';
import { pause, play, playOutline, stopSharp } from 'ionicons/icons';

import { useHotkeys } from 'react-hotkeys-hook'
import { isHotkeyPressed } from 'react-hotkeys-hook'


let dragCounter = 0;

const Home: React.FC = () => {

  const [dragging, setDragging] = useState(false);
  const [renderItems, setRenderItems] = useState(new Array<RenderItemData>());
  const [currentRenderId, setCurrentRenderId] = useState(-1);
  const [selectedRenderItems, setSelectedRenderItems] = useState<Array<number>>([]);
  const [canRender, setCanRender] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stoped, setStoped] = useState(false);
  const [currentRenderJob, setCurrentRenderJob] = useState<RenderJob>();
  const [errorAlert] = useIonAlert();

  const onRenderItemChange = (item: RenderItemData) => {
    item.updateCommand();
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
    setRenderItems(
      [
        ...renderItems.filter((item, index) =>
          index !== id
        )
      ]
    );
  };
  const renderItemDelete = (itemToDelete: RenderItemData) => {
    console.log(Object.is(renderItems[0], itemToDelete));
    
    setRenderItems(
      [
        ...renderItems.filter((item, index) =>
          !Object.is(item, itemToDelete)
        )
      ]
    );
  };

  const onDrop = (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    let dataTransfer = event.dataTransfer;
    if (!dataTransfer || !dataTransfer.files) return;

    for (let i = 0; i < dataTransfer.files.length; i++) {
      let file: File = dataTransfer.files.item(i);
      if (!file) return;
      let renderItem: RenderItemData = new RenderItemData();
      renderItem.init(file, () => {
        onRenderItemChange(renderItem);
      }, () => {
        //renderItemDelete(renderItem);
        onRenderItemChange(renderItem);
      });
      renderItems.push(renderItem);
    }

    setRenderItems([
      ...renderItems
    ]);

    setDragging(false);
  };

  const onDragOver = (event: any) => {
    event.preventDefault();
    event.stopPropagation();

  };

  const onDragEnter = (event: any) => {
    event.preventDefault();
    dragCounter++;
    setDragging(true);
  };

  const onDragLeave = (event: any) => {
    dragCounter--;
    if (dragCounter === 0)
      setDragging(false);
  };

  const startRender = (renderId: number) => {
    setCanRender(false);

    let render: RenderJob = new RenderJob(renderItems[renderId]);
    render.onClose = onRenderClose;
    render.start();
    setCurrentRenderJob(render);
  }

  const onRenderClose = (code: number) => {
    if (hasNextRenderableItem(currentRenderId)) {
      setCurrentRenderId(getNextRenderableItemId(currentRenderId));
    }
    else {
      setCurrentRenderJob(undefined);
      setCurrentRenderId(-1);
    }
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
      if (key > startIndex && item.enabled && !item.isDone && itemIndex < 0)
        itemIndex = key;
    });
    return itemIndex;
  }

  const addSelectedItem = (index: number) => {
    if (isHotkeyPressed(['meta']) || isHotkeyPressed(['control']))
      setSelectedRenderItems([...selectedRenderItems, index]);
    else if (isHotkeyPressed(['shift']) && selectedRenderItems.length > 0) {
      let min = Math.min(index, selectedRenderItems[0]);
      let max = Math.max(index, selectedRenderItems[selectedRenderItems.length - 1]);
      let newArr = [];

      for (let ind = min; ind < max + 1; ind++) {
        newArr.push(ind);
      }

      setSelectedRenderItems(newArr);
    } else
      setSelectedRenderItems([index]);
  };

  const duplicateSelectedItems = () => {
    for (let index = 0; index < selectedRenderItems.length; index++) {
      let clone: RenderItemData = new RenderItemData();
      Object.assign(clone, renderItems[index]);
      renderItems.push(clone);
    }
    setRenderItems([...renderItems]);
  };

  const deleteSelectedItems = () => {
    for (let index = 0; index < selectedRenderItems.length; index++) {
      renderItems.splice(selectedRenderItems[index], 1);
    }
    setRenderItems([...renderItems]);
  };

  const selectAllItems = () => {
    setSelectedRenderItems([...renderItems.keys()]);
  };

  const onErrorAlert = (data: any) => {
    errorAlert({
      header: data.detail.header,
      subHeader: data.detail.subHeader,
      message: data.detail.message,
      buttons: ['CLOSE'],
    });
  };




  /* ------------------------- */
  /* -----    EFFECTS    ----- */
  /* ------------------------- */

  useHotkeys('mod+d', () => duplicateSelectedItems(), { preventDefault: true }, [selectedRenderItems, renderItems]);
  useHotkeys('mod+a', () => selectAllItems(), { preventDefault: true }, [renderItems]);
  useHotkeys(['delete', 'backspace'], () => deleteSelectedItems(), { preventDefault: true }, [selectedRenderItems, renderItems]);

  useEffect(() => {
    if (currentRenderId > -1)
      startRender(currentRenderId);
  }, [currentRenderId]);

  useEffect(() => {
    if (stoped) {
      setStoped(false);
      setPaused(false);
      setCurrentRenderJob(undefined);
      setCurrentRenderId(-1);
    }
  }, [stoped]);

  useEffect(() => {
    let renderAvailable = hasNextRenderableItem(currentRenderId);
    setCanRender(renderAvailable && !(currentRenderJob && currentRenderJob.running));
  }, [renderItems, currentRenderId]);


  useEffect(() => {
    subscribe('errorAlert', onErrorAlert);

    document.addEventListener('drop', onDrop);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);

    return () => {
      document.removeEventListener('drop', onDrop);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);

      unsubscribe('errorAlert', onErrorAlert);
    }

  }, [renderItems]);




  return (

    <IonPage>
      {
        dragging && <div id="dropFilesOverlay"><span>Drop files here</span></div>
      }
      <IonHeader id="header">
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol size="1"><IonImg src="/assets/img/blender_logo_no_socket_white.png"></IonImg></IonCol>
              <IonCol size="11" class="ion-justify-content-end">
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
                    currentRenderJob.stopRender();
                    setStoped(true);
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

        <IonList id='queue' onClick={() => setSelectedRenderItems([])}>
          {renderItems.map((renderItem: RenderItemData, index: number) =>
            <RenderContainer
              onSelect={() => addSelectedItem(index)}
              onRefresh={() => refreshItem(renderItem)}
              selected={selectedRenderItems.includes(index)}
              paused={paused}
              data={renderItem}
              key={index}
              onDelete={
                () => onRenderItemDelete(index)
              }
              onToggleChange={() => {
                renderItem.enabled = !renderItem.enabled;
                if (renderItem.enabled) renderItem.status = RenderItemData.STATUS_PENDING;
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
              index={index}
            />
          )}
        </IonList>

        {currentRenderJob && currentRenderJob.running &&
          <InfosContainer renderJob={currentRenderJob} />
        }
      </IonContent>
    </IonPage >
  );
};

export default Home;
