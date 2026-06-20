import { apiRequest } from './apiClient';

export async function getWorkspaceNotifications(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/notifications`);
    return response.data.notifications;
}

export async function createWorkspaceNotification(workspaceId, { icon, iconClass, title, sub, targetEditorId }) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/notifications`, {
        method: 'POST',
        body: JSON.stringify({ icon, iconClass, title, sub, targetEditorId })
    });
    return response.data.notification;
}

export async function markWorkspaceNotificationRead(workspaceId, notificationId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/notifications/${notificationId}/read`, {
        method: 'PATCH'
    });
    return response.data.notification;
}

export async function clearWorkspaceNotifications(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/notifications`, {
        method: 'DELETE'
    });
    return response.data;
}
