import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonProgressBar } from '@ionic/react';
import RenderContainer from '../components/RenderContainer';
import { RenderItemData } from '../components/RenderContainer';
import InfosContainer from '../components/Infos/InfosContainer';
import './Home.css';
import { log } from 'console';

let inited = false;
let dragCounter = 0;
let filesCount = 0;

let items: Array<any> = [];

let renderData: Array<RenderItemData> = [];

const Home: React.FC = () => {

  const [dragging, setDragging] = useState(false);
  const [renderItems, setRenderItems] = useState([] as any);

  const onRenderItemChange = (itemData: RenderItemData) => {
    if (renderData[itemData.index])
      renderData[itemData.index] = itemData
    else
      renderData.push(itemData);


    console.log(renderData);
  };

  const onRenderItemDelete = (id: number) => {
    renderData.splice(id, 1);

    items = items.filter((item: any) => {
      return item.index != id;
    });
    setRenderItems(
      (prevItems: []) => prevItems.filter((item: any) => item.index != id)
    );
    filesCount--;
    updateIndexes();

    console.log(renderData);
  };

  const updateIndexes = () => {
    console.log("updateIndexes", items.length);
    for (let index = 0; index < renderData.length; index++) {
      renderData[index].index = index;
    }
    
    for (let index = 0; index < items.length; index++) {
      items[index].index = index;
    }
  };

  const onDragDrop = (event: DragEvent) => {

    console.log("Droped");


    let dataTransfer = event.dataTransfer;
    if (!dataTransfer || !dataTransfer.files) return;

    let itemsNew: Array<any> = renderItems;
    for (let i = 0; i < dataTransfer.files.length; i++) {
      let file = dataTransfer.files.item(i);
      if (!file) return;
      const renderItem = {
        "index": itemsNew.length,
        "blendFile": file
      };
      itemsNew.push(renderItem);
      /*renderItem.enabled = true;
      renderItem.startFrame = 1;
      renderItem.endFrame = 250;
      renderItem.scenes = ["scene_1", "scenes_2"];
      renderItem.status = 'pending';*/

      /*      items.push(renderItem);
      
            setRenderItems((prevItems: []) =>
              [
                ...prevItems,
                renderItem
              ]
            );
            filesCount++;
      
            //console.log(items);
      
            updateIndexes();
            */
    }

    setRenderItems(itemsNew);
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
          {renderItems.map((renderItem: any) =>
            <RenderContainer {...renderItem} key={renderItem.index} onChange={onRenderItemChange} onDelete={() => onRenderItemDelete(renderItem.index)} />
          )}
        </IonList>

        <InfosContainer />

      </IonContent>
    </IonPage>
  );
};

export default Home;
