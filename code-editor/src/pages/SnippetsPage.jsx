import React from 'react';
import FilesListPage from '../components/FilesList';

const SnippetsPage = () => {
    // Obtain userId from session or authentication
    const userId = '12345'; // Replace with actual userId

    return (
        <div style={{ padding: '20px' }}>
            <FilesListPage />
        </div>
    );
}

export default SnippetsPage;