import React from 'react';
import { IonItem, IonCol, IonGrid, IonInput, IonRow, IonToggle, IonProgressBar, IonLabel, IonSelect, IonSelectOption, IonIcon } from '@ionic/react';


export interface TestContainerProps {
  name: string,
}

export class TestData {
  
  command: string = "tototo";
}
const debug: boolean = true;

const RenderContainer: React.FC<TestContainerProps> = (props) => {
  

  return (
    <>
      <IonGrid >
        <IonRow>
          <IonCol size="1" className='toggle'>
            <div>{props.name}</div>
          </IonCol>
         
        </IonRow>

      </IonGrid>
    </>
  );
};

export default RenderContainer;
