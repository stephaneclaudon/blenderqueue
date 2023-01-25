import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonProgressBar } from '@ionic/react';
import RenderContainer from '../components/RenderContainer';
import { RenderContainerProps } from '../components/RenderContainer';
import InfosContainer from '../components/Infos/InfosContainer';
import './Home.css';

let inited = false;
let dragCounter = 0;
let filesCount = 0;


const Home: React.FC = () => {

  const [dragging, setDragging] = useState(false);
  const [renderItems, setRenderItems] = useState([] as any);
  
  const onRenderItemChange = (data: Object) => {
    //console.log("Item has updated", data);
  };

  const onRenderItemDelete = (id: number) => {
    setRenderItems(
      (prevItems: []) => prevItems.filter((item: any) => item.index !== id)
    );
    filesCount--;
    console.log(renderItems);
  };

  const onDragDrop = (event: DragEvent) => {

    let dataTransfer = event.dataTransfer;
    if (!dataTransfer || !dataTransfer.files) return;
    for (let i = 0; i < dataTransfer.files.length; i++) {
      let file = dataTransfer.files.item(i);
      if (!file) return;
      const renderItem = {
        "index": filesCount,
        "blendFile": file
      };
      /*renderItem.enabled = true;
      renderItem.startFrame = 1;
      renderItem.endFrame = 250;
      renderItem.scenes = ["scene_1", "scenes_2"];
      renderItem.status = 'pending';*/

      setRenderItems((prevItems: []) =>
        [
          ...prevItems,
          renderItem
        ]
      );
      filesCount++;

      console.log(renderItems);
    }
    setDragging(false);
  }

  useEffect(() => {
    if (inited) return;

    document.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();

      onDragDrop(event);
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('dragenter', (event) => {
      event.preventDefault();
      dragCounter++;
      setDragging(true);
    });

    document.addEventListener('dragleave', (event) => {
      dragCounter--;
      if (dragCounter === 0)
        setDragging(false);
    });
    inited = true;
  }, []);


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
          {renderItems.map((renderItem: any, index: number) =>
            <RenderContainer key={index} {...renderItem} onChange={onRenderItemChange} onDelete={() => onRenderItemDelete(renderItem.index)} />
          )}
        </IonList>

        <InfosContainer />

      </IonContent>
    </IonPage>
  );
};

export default Home;
