import React, { useEffect } from 'react'
import EditorPanel from '../components/EditorPannel'
import OutputPanel from '../components/OutputPannel'
import Header from '../navigations/Header'
import { useParams } from 'react-router-dom'
import { useFile } from '../context/UseFileContext'

const EditorPage = () => {

    const { fileId } = useParams();
    const { setFile } = useFile();

    useEffect(() => {
        const fetchFile = async () => {
            try {
                const response = await fetch(`/api/file/${fileId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch file");
                }

                const data = await response.json();
                setFile(data?.code);
            } catch (error) {
                console.error("Error loading file:", error);
            }
        };

        if (fileId) {
            fetchFile();
        }
    }, [fileId]);

    return (
        <div className="App min-h-screen">
            <div className="max-w-[1800px] mx-auto p-4">
                <Header />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <EditorPanel />
                    <OutputPanel />
                </div>
            </div>
        </div>
    )
}

export default EditorPage