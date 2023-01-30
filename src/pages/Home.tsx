import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonProgressBar } from '@ionic/react';
import RenderContainer from '../components/RenderContainer';
import InfosContainer from '../components/Infos/InfosContainer';
import { RenderItemData } from '../data/RenderItemData';
import './Home.css';
import { subscribe } from '../events/events';

let dragCounter = 0;

const Home: React.FC = () => {

  const [dragging, setDragging] = useState(false);
  const [renderItems, setRenderItems] = useState(new Array<RenderItemData>());
  const [currentRenderId, setCurrentRenderId] = useState(0);

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
          <IonTitle>Blender Render Queue</IonTitle>
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
        {renderItems.length > 0 &&
          <InfosContainer renderItem={renderItems[currentRenderId]} />
        }
      </IonContent>
    </IonPage>
  );
};

export default Home;
