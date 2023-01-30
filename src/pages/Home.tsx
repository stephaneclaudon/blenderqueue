import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonProgressBar } from '@ionic/react';
import RenderContainer from '../components/RenderContainer';
import TestContainerProps from '../components/test';
import { RenderItemData } from '../components/RenderContainer';
import InfosContainer from '../components/Infos/InfosContainer';
import './Home.css';
import { log } from 'console';

let inited = false;
let dragCounter = 0;

//let renderData: Array<RenderItemData> = [];

const Home: React.FC = () => {

  const [dragging, setDragging] = useState(false);
  const [renderItems, setRenderItems] = useState(new Array<RenderItemData>());

  const onRenderItemChange = (itemData: RenderItemData) => {
    /*let items: Array<RenderItemData> = renderItems;
    if (items[itemData.index])
      items[itemData.index] = itemData

    

    setRenderItems([...items]);*/
  };

  const onRenderItemDelete = (id: number) => {
    console.log("removing at ", id);
    
    //renderData.splice(id, 1);
    let items: Array<RenderItemData> = renderItems;
    items.splice(id, 1);
    updateIndexes(items);

    setRenderItems([...items]);
  };

  const updateIndexes = (items:Array<RenderItemData>) => {
    for (let index = 0; index < items.length; index++) {
      console.log(items[index].index, index);
      
      items[index].index = index;
    }
  };

  const onDragDrop = (event: DragEvent) => {

    console.log("Droped");

    let dataTransfer = event.dataTransfer;
    if (!dataTransfer || !dataTransfer.files) return;

    let itemsNew: Array<RenderItemData> = renderItems;
    for (let i = 0; i < dataTransfer.files.length; i++) {
      let file = dataTransfer.files.item(i);
      if (!file) return;
      const renderItem: RenderItemData = new RenderItemData();
      renderItem.index = itemsNew.length;
      renderItem.blendFile = file;
      itemsNew.push(renderItem);
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


  console.log(renderItems);


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

        <div>
        {renderItems.map((renderItem: RenderItemData, index: number) => 
          <TestContainerProps key={index} name={renderItem.blendFile.name} />
        )}
        </div>

        <IonList id='queue'>
          {renderItems.map((renderItem: RenderItemData, index: number) =>
            <RenderContainer data={renderItem} key={index}  onDelete={() => onRenderItemDelete(renderItem.index)} />
          )}
        </IonList>

        <InfosContainer />

      </IonContent>
    </IonPage>
  );
};

export default Home;
