import { IonCol, IonGrid, IonRow } from '@ionic/react';
import React from 'react';
import { RenderItemData } from '../../data/RenderItemData';

import './RenderTooltip.css';

export interface RenderTooltipProps {
    data: RenderItemData
}

const debug: boolean = false;

const RenderContainer: React.FC<RenderTooltipProps> = (props) => {
    const strippedPath = (path:string) => {
        return '...' + path.slice(-30);
    };

    return (
        <>
            <IonGrid>
                <IonRow><IonCol size='3'>Width :</IonCol><IonCol size='9' class="ion-justify-content-start">{props.data.sceneData.resolution_x}px</IonCol></IonRow>
                <IonRow><IonCol size='3'>Height :</IonCol><IonCol size='9' class="ion-justify-content-start">{props.data.sceneData.resolution_y}px</IonCol></IonRow>
                <IonRow><IonCol size='3'>Format :</IonCol><IonCol size='9' class="ion-justify-content-start">{props.data.sceneData.file_format}</IonCol></IonRow>
                <IonRow><IonCol size='3'>Alpha :</IonCol><IonCol size='9' class="ion-justify-content-start">{props.data.sceneData.film_transparent?'Yes':'No'}</IonCol></IonRow>
                <IonRow><IonCol size='3'>Output :</IonCol><IonCol size='9' class="filepath ion-justify-content-start">{strippedPath(props.data.sceneData.filepath)}</IonCol></IonRow>

            </IonGrid>
        </>
    );
};

export default RenderContainer;
