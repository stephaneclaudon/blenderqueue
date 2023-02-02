import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonProgressBar, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonImg } from '@ionic/react';
import RenderContainer from '../components/RenderContainer';
import InfosContainer from '../components/Infos/InfosContainer';
import { RenderItemData } from '../data/RenderItemData';
import './Home.css';
import { subscribe } from '../events/events';
import { RenderJob } from '../services/services';
import { pause, pauseOutline, play, playOutline, stopOutline, stopSharp } from 'ionicons/icons';


let dragCounter = 0;

const Home: React.FC = () => {

  const [dragging, setDragging] = useState(false);
  const [renderItems, setRenderItems] = useState(new Array<RenderItemData>());
  const [currentRenderId, setCurrentRenderId] = useState(-1);
  const [canRender, setCanRender] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stoped, setStoped] = useState(false);

  const [currentRenderJob, setCurrentRenderJob] = useState<RenderJob>();

  const onRenderItemChange = (item: RenderItemData) => {
    item.updateCommand();
    setRenderItems([...renderItems]);
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

  const onDrop = (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    let dataTransfer = event.dataTransfer;
    if (!dataTransfer || !dataTransfer.files) return;

    for (let i = 0; i < dataTransfer.files.length; i++) {
      let file = dataTransfer.files.item(i);
      if (!file) return;
      let renderItem: RenderItemData = new RenderItemData(file);
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
    if (!renderItems[renderId].enabled || renderItems[renderId].isDone) {
      setCurrentRenderId(currentRenderId + 1);
      return;
    }

    let render: RenderJob = new RenderJob(renderItems[renderId]);
    render.onClose = onRenderClose;
    render.start();
    setCurrentRenderJob(render);
  }

  const onRenderClose = (code: number) => {
    //console.log(currentRenderId, renderItems.length);
    if (currentRenderId < (renderItems.length - 1)) {
      setCurrentRenderId(currentRenderId + 1);
    }
    else {
      setCurrentRenderJob(undefined);
      setCurrentRenderId(-1);
    }
  };

  useEffect(() => {
    if (currentRenderId > -1)
      startRender(currentRenderId);

  }, [currentRenderId]);

  useEffect(() => {
    if(stoped) {
      setStoped(false);
      setPaused(false);
      setCurrentRenderJob(undefined);
      setCurrentRenderId(-1);
    }
  }, [stoped]);

  useEffect(() => {
    let renderAvailable = false;
    for (const renderItem of renderItems) {

      if (renderItem.enabled && !renderItem.isDone && !renderItem.isRendering) {
        renderAvailable = true;
        break;
      }
    }
    setCanRender(renderAvailable && !(currentRenderJob && currentRenderJob.running));

  }, [renderItems]);


  useEffect(() => {
    subscribe('updateList', () => {
      console.log("updateList", renderItems.length);
      setRenderItems([...renderItems]);
    });

    document.addEventListener('drop', onDrop);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);

    return () => {
      document.removeEventListener('drop', onDrop);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
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
                  <IonButton disabled={!canRender} onClick={() => setCurrentRenderId(currentRenderId + 1)} color="primary">
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

        <IonList id='queue'>
          {renderItems.map((renderItem: RenderItemData, index: number) =>
            <RenderContainer
              paused={paused}
              data={renderItem}
              key={index}
              onDelete={
                () => onRenderItemDelete(index)
              }
              onToggleChange={() => {
                renderItem.enabled = !renderItem.enabled;
                if(renderItem.enabled) renderItem.status = RenderItemData.STATUS_PENDING;
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
