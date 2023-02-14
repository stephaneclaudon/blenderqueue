import { IonCol, IonGrid, IonRow } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { RenderItemData } from '../../data/RenderItemData';

//import './RenderTooltip.css';

export interface DragDropProps {
    onDrop: Function
}

let dragCounter = 0;

const RenderContainer: React.FC<DragDropProps> = (props) => {

    const [dragging, setDragging] = useState(false);

    const onDrop = (event: any) => {
        event.preventDefault();
        event.stopPropagation();

        let dataTransfer = event.dataTransfer;
        if (!dataTransfer || !dataTransfer.files) return;
        props.onDrop(dataTransfer.files as FileList);

        dragCounter = 0;
        setDragging(false);
    };

    const onDragOver = (event: any) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const onDragEnter = (event: any) => {
        event.preventDefault();
        dragCounter++;
        setDragging(true);
    };

    const onDragLeave = (event: any) => {
        dragCounter--;
        if (dragCounter === 0)
            setDragging(false);
    };


    useEffect(() => {
        document.addEventListener('drop', onDrop);
        document.addEventListener('dragover', onDragOver);
        document.addEventListener('dragenter', onDragEnter);
        document.addEventListener('dragleave', onDragLeave);

        return () => {
            document.removeEventListener('drop', onDrop);
            document.removeEventListener('dragover', onDragOver);
            document.removeEventListener('dragenter', onDragEnter);
            document.removeEventListener('dragleave', onDragLeave);
        }
    });

    return (
        <>
            {dragging &&
                <div id="dropFilesOverlay"><span>Drop files here</span></div>
            }
        </>
    );
};

export default RenderContainer;
