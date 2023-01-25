import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonProgressBar } from '@ionic/react';
import RenderContainer from '../components/RenderContainer';
import { RenderContainerProps } from '../components/RenderContainer';
import InfosContainer from '../components/Infos/InfosContainer';
import './Home.css';

const Home: React.FC = () => {
  const [dragging, setDragging] = useState(false);
  const [renderItems, setRenderItems] = useState<Array<RenderContainerProps>>([]);
  let renderItemsTemp: Array<RenderContainerProps> = [];
  let inited = false;
  let dragCounter = 0;

  useEffect(() => {
    if (inited) return;

    document.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();

      let dataTransfer = event.dataTransfer;
      if (!dataTransfer || !dataTransfer.files) return;
      for (let i = 0; i < dataTransfer.files.length; i++) {
        let file = dataTransfer.files.item(i);
        if (!file) return;
        let renderItem = {} as RenderContainerProps;
        renderItem.blendFile = file;
        renderItem.enabled = true;
        renderItem.startFrame = 1;
        renderItem.endFrame = 250;
        renderItem.scenes = ["scene_1", "scenes_2"];
        renderItem.status = 'pending';

        renderItemsTemp.push(renderItem);
        setRenderItems([...renderItemsTemp]);
      }
      setDragging(false);
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
          {renderItems.map((renderItem, index) =>
            <RenderContainer key={index} {...renderItem} />
          )}
        </IonList>

        <InfosContainer />

      </IonContent>
    </IonPage>
  );
};

export default Home;
