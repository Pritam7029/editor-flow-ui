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

// Thread-based and E2EE message endpoints
export async function getChatThreads(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/chat/threads`);
    return response.data.threads;
}

export async function createChatThread(workspaceId, { type, encryptedName, nameIv, memberIds }) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/chat/threads`, {
        method: 'POST',
        body: JSON.stringify({ type, encryptedName, nameIv, memberIds })
    });
    return response.data.thread;
}

export async function getThreadMessages(workspaceId, threadId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/chat/threads/${threadId}/messages`);
    return response.data.messages;
}

export async function sendThreadMessage(workspaceId, threadId, {
    encryptedBody,
    bodyIv,
    encryptionAlgorithm,
    workspaceKeyId,
    senderDeviceKeyId,
    clientMessageId,
    messageType
}) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/chat/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
            encryptedBody,
            bodyIv,
            encryptionAlgorithm,
            workspaceKeyId,
            senderDeviceKeyId,
            clientMessageId,
            messageType
        })
    });
    return response.data.message;
}

export async function deleteChatMessage(workspaceId, messageId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/chat/messages/${messageId}`, {
        method: 'DELETE'
    });
    return response.data;
}

