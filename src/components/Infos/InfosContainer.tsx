import React, { useEffect, useState } from 'react';
import { IonCol, IonGrid, IonRow, IonProgressBar, IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';

import './InfosContainer.css';
import { RenderJob } from '../../services/services';
import * as Utils from '../../utils/utils';

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
        return props.renderJob.frame.toString()
            + ' of ' +
            (props.renderJob.renderItem.endFrame - props.renderJob.renderItem.startFrame + 1)
            + ' ('
            + getProgressPercent()
            + ')';
    };

    const getProgress = () => {
        return (props.renderJob.frame - props.renderJob.renderItem.startFrame) / (props.renderJob.renderItem.endFrame - props.renderJob.renderItem.startFrame + 1);
    };

    const getBuffer = () => {
        return getProgress() + (1 / (props.renderJob.renderItem.endFrame - props.renderJob.renderItem.startFrame + 1));
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
        }, 200);

        return () => {
            clearInterval(interval)
        };
    }, []);

    return (
        <>
            <div id='InfosContainer' >

                <IonSegment className="ion-justify-content-start" value={segment} onIonChange={(e) => handleSegmentChange(e)} >
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
                                <IonCol size="9" class="ion-align-items-start">
                                    <IonGrid className='progress-info'>
                                        <IonRow>
                                            Rendering {props.renderJob.renderItem.blendFileName} ({props.renderJob.renderItem.sceneName})
                                        </IonRow>

                                        <IonRow>
                                            <IonProgressBar buffer={getBuffer()} value={getProgress()} ></IonProgressBar>
                                        </IonRow>

                                        <IonRow className="progress-values">
                                            <IonCol size="1" class="ion-justify-content-start">{props.renderJob.renderItem.startFrame}</IonCol>
                                            <IonCol size="10">{getProgressString()}</IonCol>
                                            <IonCol size="1" class="ion-justify-content-end">{props.renderJob.renderItem.endFrame}</IonCol>
                                        </IonRow>

                                        <IonRow className="progress-values">
                                            <IonCol size="4" class="ion-justify-content-start ion-no-padding"><span className="label">Elapsed :</span><span className="important-value">{timeFormat(props.renderJob.elapsedTime)}</span></IonCol>
                                            <IonCol size="4" class="ion-justify-content-start ion-no-padding"><span className="label">Last frame :</span><span className="important-value">{timeFormat(props.renderJob.lastFrameTime)}</span></IonCol>
                                            <IonCol size="4" class="ion-justify-content-start ion-no-padding"><span className="label">Remaining :</span><span className="important-value">{timeFormat(props.renderJob.remainingTime)}</span></IonCol>
                                        </IonRow>

                                    
                                        <IonRow className="output-line">{Utils.stripString(props.renderJob.outputStringLastLine, 145)}</IonRow>

                                    
                                    </IonGrid>
                                </IonCol>

                                <IonCol size="3">
                                    <img src={
                                        (props.renderJob.lastFrameFilePath !== '')
                                            ? props.renderJob.lastFrameFilePath
                                            : '/assets/img/default-preview.jpg'
                                    }
                                        alt="Last frame preview" />
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
