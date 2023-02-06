import React, { useState, useRef, useEffect } from 'react';
import {
    IonButtons,
    IonButton,
    IonModal,
    IonHeader,
    IonContent,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
} from '@ionic/react';
import { OverlayEventDetail } from '@ionic/core/components';
import './Settings.css';
import * as Services from '../../services/services';
import { RenderItemData } from '../../data/RenderItemData';
import { BlenderQueueData } from '../../data/SettingsData';

export interface SettingsProps {
    onSettingsUpdated: Function
};

const Settings: React.FC<SettingsProps> = (props) => {
    const [appSettings, setAppSettings] = useState(new BlenderQueueData());

    const input = useRef<HTMLIonInputElement>(null);
    const blenderExeInputFile = useRef<HTMLInputElement>(null);
    const modal = useRef<HTMLIonModalElement>(null);


    const onExePathChange = (event: any) => {
        appSettings.settings.blenderBinaryPath = event.target.value;
        setAppSettings({...appSettings});
    };

    const onBlenderExeChange = (event: any) => {
        if (blenderExeInputFile.current?.files && blenderExeInputFile.current.files.length > 0) {
            //@ts-ignore
            appSettings.settings.blenderBinaryPath = blenderExeInputFile.current?.files[0].path;
            setAppSettings({...appSettings});
        }
    }

    function onWillDismiss(ev: CustomEvent<OverlayEventDetail>) {
        if (ev.detail.role === 'confirm') {
            console.log("Settings SaveData:", appSettings);
            
            Services.SaveData(appSettings).then((response:any) => {
                props.onSettingsUpdated();
            }).catch(() => {
                console.error("Can't save settings...");
                
            });
        }
    }

    useEffect(() => {
        console.log("Settings getData");
        
        Services.GetData().then((data: BlenderQueueData) => {
            setAppSettings({...data});
        }).catch(() => {
            console.log("Settings.tsx, could not retrieve App Settings");
        });
    }, [modal]);


    return (
        <IonModal ref={modal} trigger="open-settings" onWillDismiss={(ev) => onWillDismiss(ev)}>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => modal.current?.dismiss()}>Cancel</IonButton>
                    </IonButtons>
                    <IonTitle class="ion-text-center">Settings</IonTitle>
                    <IonButtons slot="end">
                        <IonButton strong={true} onClick={() => modal.current?.dismiss({}, 'confirm')}>
                            Confirm
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonItem>
                    <IonLabel position="stacked">Blender path</IonLabel>
                    <IonInput ref={input} type="text" placeholder="Enter path to Blender's executable file" value={appSettings.settings.blenderBinaryPath} onIonChange={onExePathChange} />
                    <IonButton onClick={() => blenderExeInputFile.current?.click()} slot="end">Open</IonButton>
                    <input onChange={onBlenderExeChange} ref={blenderExeInputFile} id="blender-path-input" type="file" placeholder=""></input>
                </IonItem>
            </IonContent>
        </IonModal>
    );
}

export default Settings;
