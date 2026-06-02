import { apiRequest } from './apiClient';

export async function getWorkspaceFiles(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/files`);
    return response.data.files;
}

export async function uploadWorkspaceFiles(workspaceId, files) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/files`, {
        method: 'POST',
        body: JSON.stringify({ files })
    });
    return response.data.files;
}

export async function deleteWorkspaceFile(workspaceId, fileId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/files/${fileId}`, {
        method: 'DELETE'
    });
    return response.data;
}

export async function updateWorkspaceFilePermissions(workspaceId, fileId, visibleTo) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/files/${fileId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ visibleTo })
    });
    return response.data.visibleTo;
}

export async function addWorkspaceFileComment(workspaceId, fileId, text, timestamp) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/files/${fileId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text, timestamp })
    });
    return response.data.comment;
}
