export const getMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'png': return 'image/png';
        case 'jpg': case 'jpeg': return 'image/jpeg';
        case 'csv': return 'text/csv';
        case 'json': return 'application/json';
        case 'txt': return 'text/plain';
        default: return 'application/octet-stream'; // Default binary type
    }
};

export const processArtifactBlob = (artifactData: string, fileName: string): Blob => { //artifactData = raw data
    const mimeType = getMimeType(fileName);

    if (mimeType.startsWith('image/')) {
        // Process image files as binary
        return new Blob(
            [Uint8Array.from(atob(artifactData), c => c.charCodeAt(0))],
            { type: mimeType }
        );
    } else {
        // Process text or other non-binary files
        return new Blob([artifactData], { type: mimeType });
    }
};
