import { apiRequest } from './apiClient';

/**
 * Initialize a file upload with the backend.
 */
export async function initFileUpload(workspaceId, payload) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/init-upload', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return response.data;
}

/**
 * Complete a file upload with the backend.
 */
export async function completeFileUpload(workspaceId, payload) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/complete-upload', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return response.data;
}

/**
 * Get all files for a workspace.
 */
export async function getWorkspaceFiles(workspaceId) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files');
    return response.data.files;
}

/**
 * Retrieve details for a single file.
 */
export async function getFile(workspaceId, fileId) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/' + fileId);
    return response.data.file;
}

/**
 * Delete a file.
 */
export async function deleteFile(workspaceId, fileId) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/' + fileId, {
        method: 'DELETE'
    });
    return response.data;
}

/**
 * Get versions of a file.
 */
export async function getFileVersions(workspaceId, fileId) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/' + fileId + '/versions');
    return response.data.versions;
}

/**
 * Create/initiate a new file version.
 */
export async function createFileVersion(workspaceId, fileId, payload) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/' + fileId + '/versions', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return response.data;
}

/**
 * Get revisions for a file.
 */
export async function getFileRevisions(workspaceId, fileId) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/' + fileId + '/revisions');
    return response.data.revisions;
}

/**
 * Create a new file revision comment.
 */
export async function createFileRevision(workspaceId, fileId, payload) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/' + fileId + '/revisions', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return response.data.comment;
}

/**
 * Update an existing file revision.
 */
export async function updateFileRevision(workspaceId, fileId, revisionId, payload) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/' + fileId + '/revisions/' + revisionId, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
    return response.data.comment;
}

/**
 * Delete a file revision.
 */
export async function deleteFileRevision(workspaceId, fileId, revisionId) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/' + fileId + '/revisions/' + revisionId, {
        method: 'DELETE'
    });
    return response.data;
}

/**
 * Update visibility permissions for a file.
 */
export async function updateFilePermissions(workspaceId, fileId, visibleTo) {
    const response = await apiRequest('/api/workspaces/' + workspaceId + '/files/' + fileId + '/permissions', {
        method: 'PATCH',
        body: JSON.stringify({ visibleTo })
    });
    return response.data.visibleTo;
}

/**
 * Helper to upload a file directly to a signed upload URL with progress monitoring.
 */
export function uploadFileWithProgress(signedUrl, token, file, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        
        if (token) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }
        
        // Explicitly check for upload availability
        if (xhr.upload) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentage = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentage);
                }
            };
        }
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error('Upload failed with status ' + xhr.status));
            }
        };
        
        xhr.onerror = () => {
            reject(new Error('Network error during upload'));
        };

        xhr.send(file);
    });
}

// Keep backward compatible aliases for AppContext.jsx
export const deleteWorkspaceFile = deleteFile;
export const updateWorkspaceFilePermissions = updateFilePermissions;
export const addWorkspaceFileComment = createFileRevision;
