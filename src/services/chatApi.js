import { apiRequest } from './apiClient';

export async function getWorkspaceChat(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/chat`);
    return response.data;
}

export async function sendWorkspaceChatMessage(workspaceId, { text, channel, convType, recipientId, teamId }) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/chat/messages`, {
        method: 'POST',
        body: JSON.stringify({ text, channel, convType, recipientId, teamId })
    });
    return response.data.message;
}

export async function createWorkspaceChatTeam(workspaceId, { name, memberIds }) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/chat/teams`, {
        method: 'POST',
        body: JSON.stringify({ name, memberIds })
    });
    return response.data.team;
}

export async function clearWorkspaceChat(workspaceId, { convType, targetId }) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/chat/clear`, {
        method: 'POST',
        body: JSON.stringify({ convType, targetId })
    });
    return response.data;
}
