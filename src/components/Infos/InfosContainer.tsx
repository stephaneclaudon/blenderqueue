import React, { useEffect, useState } from 'react';
import { IonCol, IonGrid, IonRow, IonProgressBar, IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';

import './InfosContainer.css';
import { RenderJob } from '../../services/services';
import * as Utils from '../../utils/utils';

interface InfosContainerProps {
    renderJob: RenderJob
}

const InfosContainer: React.FC<InfosContainerProps> = (props) => {


    const logDiv = React.useRef<HTMLDivElement>(null);
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
        return Math.floor(props.renderJob.progress * 100).toString() + '%';
    };

    const getProgressString = () => {
        return props.renderJob.frame.toString()
            + ' of ' +
            (props.renderJob.renderItem.endFrame - props.renderJob.renderItem.startFrame + 1)
            + ' ('
            + getProgressPercent()
            + ')';
    };

    const getBuffer = () => {
        return props.renderJob.progress + (1 / (props.renderJob.renderItem.endFrame - props.renderJob.renderItem.startFrame + 1));
    };


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
            <div id='InfosContainer' className={props.renderJob.paused ? 'paused' : (!props.renderJob.running) ? 'waiting' : 'running'} >

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
                                <IonCol size="9" class="ion-align-items-start" id="progress-infos">
                                    <IonGrid className='progress-info'>
                                        <IonRow>
                                            {props.renderJob.running
                                                ? <span>Rendering: {props.renderJob.renderItem.blendFileName} ({props.renderJob.renderItem.sceneName})</span>
                                                : <span>Rendering: </span>
                                            }
                                        </IonRow>

                                        <IonRow> {props.renderJob.running
                                            ? <IonProgressBar className='current-frame-progress' type={(props.renderJob.isFrameInitializing && !props.renderJob.paused) ? 'indeterminate' : 'determinate'} value={(props.renderJob.isFrameInitializing && props.renderJob.paused) ? 0.5 : props.renderJob.currentFrameProgress} ></IonProgressBar>
                                            : <IonProgressBar className='current-frame-progress' value={1} ></IonProgressBar>
                                        }
                                        </IonRow>

                                        {props.renderJob.running
                                            ? <IonRow>
                                                {((props.renderJob.renderItem.endFrame - props.renderJob.renderItem.startFrame > 1))
                                                    ? <IonProgressBar className='main-progress' buffer={getBuffer()} value={props.renderJob.progress} ></IonProgressBar>
                                                    : <IonProgressBar className='main-progress' type={(props.renderJob.isFrameInitializing && !props.renderJob.paused && props.renderJob.running) ? 'indeterminate' : 'determinate'} value={(props.renderJob.isFrameInitializing && props.renderJob.paused) ? 0.5 : props.renderJob.currentFrameProgress} ></IonProgressBar>
                                                }
                                            </IonRow>
                                            : <IonRow>
                                                <IonProgressBar className='main-progress' value={1} ></IonProgressBar>
                                            </IonRow>
                                        }

                                        <IonRow className="progress-values">
                                            <IonCol size="1" class="ion-justify-content-start">{props.renderJob.renderItem.startFrame}</IonCol>
                                            <IonCol size="10">{props.renderJob.running && getProgressString()}</IonCol>
                                            <IonCol size="1" class="ion-justify-content-end">{props.renderJob.renderItem.endFrame}</IonCol>
                                        </IonRow>

                                        <IonRow className="progress-values">
                                            <IonCol size="4" class="ion-justify-content-start ion-no-padding"><span className="label">Elapsed :</span><span className="important-value">{timeFormat(props.renderJob.elapsedTime)}</span></IonCol>
                                            <IonCol size="4" class="ion-justify-content-start ion-no-padding"><span className="label">Last frame :</span><span className="important-value">{timeFormat(props.renderJob.lastFrameTime)}</span></IonCol>
                                            <IonCol size="4" class="ion-justify-content-start ion-no-padding"><span className="label">Remaining :</span><span className="important-value">{timeFormat(props.renderJob.remainingTime)}</span></IonCol>
                                        </IonRow>


                                        <IonRow className="output-line">{
                                            (props.renderJob.outputStringLastLine !== '')
                                                ? Utils.stripString(props.renderJob.outputStringLastLine, 145)
                                                : 'Status: waiting for render job.'
                                        }</IonRow>


                                    </IonGrid>
                                </IonCol>

                                <IonCol size="3" id='preview-image'>
                                    <div style={{
                                        backgroundImage: `url(${(props.renderJob.lastFrameImageData !== '')
                                        ? props.renderJob.lastFrameImageData
                                        : '/assets/img/default-preview.jpg'
                                    })`
                                    }}></div>
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </div>
                    :
                    <div id='log' ref={logDiv}>
                        <p>
                            {(props.renderJob.outputString !== '') ? props.renderJob.outputString : 'Status: waiting for render job.'}
                        </p>
                    </div>
                }
            </div>
        </>
    );
};

export default InfosContainer;
