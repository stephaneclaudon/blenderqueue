import React, { useEffect, useState } from 'react';
import { IonCol, IonGrid, IonRow, IonProgressBar, IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';

import './InfosContainer.css';
import { RenderJob } from '../../services/services';

interface InfosContainerProps {
    renderJob: RenderJob;
}

const InfosContainer: React.FC<InfosContainerProps> = (props) => {
    const [segment, setSegment] = useState('progress');
    const [time, setTime] = useState(new Date());

    const timeFormat = (millis: number) => {
        let strings = [];

        strings.push(Math.floor((millis / (1000 * 60 * 60)) % 24).toString().padStart(2, '0'));
        strings.push(Math.floor((millis / (1000 * 60)) % 60).toString().padStart(2, '0'));
        strings.push(Math.floor((millis / 1000) % 60).toString().padStart(2, '0'));

        return strings.join(':');
    }

    const handleSegmentChange = (e: any) => {
        setSegment(e.detail.value);
    };

    const getProgressPercent = () => {
        return Math.floor(getProgress() * 100).toString() + '%';
    };

    const getProgressString = () => {
        return props.renderJob.frame.toString() + '/' + (props.renderJob.renderItem.endFrame - props.renderJob.renderItem.startFrame + 1);
    };

    const getProgress = () => {
        return props.renderJob.frame / (props.renderJob.renderItem.endFrame - props.renderJob.renderItem.startFrame + 1);
    };

    
    const logDiv = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (logDiv.current) {
            logDiv.current.scrollTop = logDiv.current.scrollHeight;
        }
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => {
            clearInterval(interval)
        };
    }, []);


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

                        <IonGrid>

                            <IonRow>
                                
                            </IonRow>




                            <IonRow>
                                <IonCol size="11">
                                    <IonProgressBar value={getProgress()} ></IonProgressBar>
                                </IonCol>
                                <IonCol size="1">
                                    {getProgressPercent()}
                                </IonCol>
                            </IonRow>
                            <IonRow >
                                <IonCol size="1" class="ion-justify-content-start">{props.renderJob.renderItem.startFrame}</IonCol>
                                <IonCol size="9">{getProgressString()}</IonCol>
                                <IonCol size="1" class="ion-justify-content-end">{props.renderJob.renderItem.endFrame}</IonCol>
                            </IonRow>


                            <IonRow>
                                <IonCol size="4" class="ion-justify-content-start ion-text-left">
                                    <IonGrid>
                                        <IonRow><span>Elapsed :</span>{timeFormat(props.renderJob.elapsedTime)}</IonRow>
                                        <IonRow><span>Remaining :</span>{timeFormat(props.renderJob.remainingTime)}</IonRow>
                                        <IonRow><span>Last frame :</span>{timeFormat(props.renderJob.lastFrameTime)}</IonRow>
                                    </IonGrid>
                                </IonCol>

                                <IonCol size="4">
                                    <img src={props.renderJob.lastFrameFilePath} alt="Last frame preview" />
                                </IonCol>
                                <IonCol size="4">

                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </div>
                    :
                    <div id='log' ref={logDiv}>
                        <p>
                            {props.renderJob.outputString}
                        </p>
                    </div>
                }
            </div>
        </>
    );
};

export default InfosContainer;
