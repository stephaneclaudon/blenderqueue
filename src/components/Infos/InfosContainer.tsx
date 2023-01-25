import React, { useEffect, useState } from 'react';
import { informationCircle, trendingUpSharp } from 'ionicons/icons';
import { IonItem, IonCol, IonGrid, IonInput, IonRow, IonToggle, IonProgressBar, IonLabel, IonSelect, IonSelectOption, IonIcon, IonSegment, IonSegmentButton } from '@ionic/react';

import './InfosContainer.css';

interface ContainerProps { }

const InfosContainer: React.FC<ContainerProps> = () => { 
    const [segment, setSegment] = useState('progress');

    const handleSegmentChange = (e: any) => {
        setSegment(e.detail.value);
    };

    const [progress, setProgress] = useState(0);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prevProgress) => prevProgress + 0.01);
      }, 200);
  
      return () => clearInterval(interval);
    }, []);

    if (progress > 0.2 && initializing) {
        setInitializing(false);
    }
  
    if (progress > 1) {
      setTimeout(() => {
        setProgress(0);
        setInitializing(true);
      }, 1000);
    }

    return (
        <>
            <div id='InfosContainer' >

                <IonSegment value={segment} onIonChange={(e) => handleSegmentChange(e)} >
                    <IonSegmentButton value='progress'>
                        <IonLabel>Progress</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value='log'>
                        <IonLabel>Log output</IonLabel>
                    </IonSegmentButton>
                </IonSegment>
                {segment === 'progress' ?
                    <div id='progress'>
                        <IonProgressBar value={progress} type={initializing ? 'indeterminate' : 'determinate'}></IonProgressBar>
                    </div>
                    :
                    <div id='log'>
                        <p>
                            [react-scripts] src/pages/Home.tsx<br />
                            [react-scripts]   Line 1:73:  'IonProgressBar' is defined but never used     @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 7:9:   'progress' is assigned a value but never used  @typescript-eslint/no-unused-vars<br />
                            [react-scripts] Search for the keywords to learn more about each warning.<br />
                            [react-scripts] To ignore, add // eslint-disable-next-line to the line before.<br />
                            [react-scripts] WARNING in [eslint] <br />
                            [react-scripts] src/components/Infos/InfosContainer.tsx<br />
                            [react-scripts]   Line 2:10:   'informationCircle' is defined but never used  @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:10:   'IonItem' is defined but never used            @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:19:   'IonCol' is defined but never used             @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:27:   'IonGrid' is defined but never used            @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:36:   'IonInput' is defined but never used           @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:46:   'IonRow' is defined but never used             @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:81:   'IonLabel' is defined but never used           @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:91:   'IonSelect' is defined but never used          @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:102:  'IonSelectOption' is defined but never used    @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:119:  'IonIcon' is defined but never used            @typescript-eslint/no-unused-vars<br />
                            [react-scripts] src/components/RenderContainer.tsx<br />
                            [react-scripts]   Line 3:19:  'IonCol' is defined but never used          @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:27:  'IonGrid' is defined but never used         @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:46:  'IonRow' is defined but never used          @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 3:65:  'IonProgressBar' is defined but never used  @typescript-eslint/no-unused-vars<br />
                            [react-scripts] src/pages/Home.tsx<br />
                            [react-scripts]   Line 1:73:  'IonProgressBar' is defined but never used     @typescript-eslint/no-unused-vars<br />
                            [react-scripts]   Line 7:9:   'progress' is assigned a value but never used  @typescript-eslint/no-unused-vars<br />
                            [react-scripts] webpack compiled with 1 warning<br /></p>
                    </div>
                }
            </div>
        </>
    );
};

export default InfosContainer;
