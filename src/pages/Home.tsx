import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonProgressBar, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonImg } from '@ionic/react';
import RenderContainer from '../components/RenderContainer';
import InfosContainer from '../components/Infos/InfosContainer';
import { RenderItemData } from '../data/RenderItemData';
import './Home.css';
import { subscribe } from '../events/events';
import { RenderJob } from '../services/services';
import { playOutline } from 'ionicons/icons';


let dragCounter = 0;
//let render: RenderJob = new RenderJob(new RenderItemData(new File([], 'toto')));
//render.start();

const Home: React.FC = () => {

  const [dragging, setDragging] = useState(false);
  const [renderItems, setRenderItems] = useState(new Array<RenderItemData>());
  const [currentRenderId, setCurrentRenderId] = useState(-1);
  const [render, setRender] = useState(false);

  const [currentRenderJob, setCurrentRenderJob] = useState<RenderJob>();

  const onRenderItemChange = (item: RenderItemData) => {
    item.updateCommand();
    console.log("onRenderItemChange", renderItems.length);
    setRenderItems([...renderItems]);
  };

  const onRenderItemDelete = (id: number) => {

    console.log("onRenderItemDelete", renderItems.length);
    console.log("removing at ", id);
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

  const startRender = (renderId:number) => {
    //console.log("start rendering...");
    if (!renderItems[renderId].enabled || renderItems[renderId].isDone) {
      setCurrentRenderId(currentRenderId+1);
      return;
    }
    
    let render: RenderJob = new RenderJob(renderItems[renderId]);
    render.onClose = onRenderClose;
    render.start();
    setCurrentRenderJob(render);
  }

  const onRenderClose = (code:number) => {
    //console.log("Render onClose", code);
    console.log(currentRenderId, renderItems.length);
    if (currentRenderId < (renderItems.length - 1)) {
      setCurrentRenderId(currentRenderId+1);
    }
    else {
      setCurrentRenderJob(undefined);
      setCurrentRenderId(-1);
      console.log("terminoch");
    }
  };

  console.log("Reloaded", currentRenderId);
  
  useEffect(() => {
    console.log("currentRenderId....", currentRenderId);
    if (currentRenderId > -1)
      startRender(currentRenderId);
    
  }, [currentRenderId]);


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
      <IonHeader>
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol size="1"><IonImg src="/assets/img/blender_logo_no_socket_white.png"></IonImg></IonCol>
              <IonCol size="11" class="ion-justify-content-end">
                {renderItems.length > 0 && !(currentRenderJob && currentRenderJob.running) &&
                  <IonButton onClick={() => setCurrentRenderId(currentRenderId + 1)} color="primary">
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
              data={renderItem}
              key={index}
              onDelete={
                () => onRenderItemDelete(index)
              }
              onToggleChange={() => {
                renderItem.enabled = !renderItem.enabled;
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
    </IonPage>
  );
};

export default Home;
