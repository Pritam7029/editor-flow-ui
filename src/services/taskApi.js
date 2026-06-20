import { apiRequest } from './apiClient';

export async function getWorkspaceColumns(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/columns`);
    return response.data.columns;
}

export async function createWorkspaceColumn(workspaceId, { key, label, emoji, color, position }) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/columns`, {
        method: 'POST',
        body: JSON.stringify({ key, label, emoji, color, position })
    });
    return response.data.column;
}

export async function updateWorkspaceColumn(workspaceId, columnId, payload) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/columns/${columnId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
    return response.data.column;
}

export async function deleteWorkspaceColumn(workspaceId, columnId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/columns/${columnId}`, {
        method: 'DELETE'
    });
    return response.data;
}

export async function reorderWorkspaceColumns(workspaceId, keys) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/columns/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ keys })
    });
    return response.data;
}

export async function getWorkspaceTasks(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/tasks`);
    return response.data.tasks;
}

export async function createWorkspaceTask(workspaceId, payload) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return response.data.task;
}

export async function updateWorkspaceTask(workspaceId, taskId, payload) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
    return response.data.task;
}

export async function deleteWorkspaceTask(workspaceId, taskId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: 'DELETE'
    });
    return response.data;
}

export async function addWorkspaceTaskComment(workspaceId, taskId, text) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text })
    });
    return response.data.comment;
}
