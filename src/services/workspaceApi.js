import { apiRequest } from './apiClient';

export async function getMyProfile() {
    const response = await apiRequest('/api/profile/me');

    return response.data;
}

export async function getWorkspaces() {
    const response = await apiRequest('/api/workspaces');

    return response.data.workspaces;
}

export async function createWorkspace(name) {
    const response = await apiRequest('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name })
    });

    return response.data.workspace;
}

export async function getWorkspace(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}`);

    return response.data;
}

export async function updateWorkspace(workspaceId, name) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name })
    });

    return response.data.workspace;
}

export async function getWorkspaceMembers(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/members`);

    return response.data.members;
}
export async function deleteWorkspace(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE'
    });

    return response.data;
}

export async function inviteMemberToWorkspace(workspaceId, email, role) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        body: JSON.stringify({ email, role })
    });

    return response.data;
}

export async function getInviteDetails(token) {
    const response = await apiRequest(`/api/invites/${token}`);

    return response.data.invite;
}

export async function acceptWorkspaceInvite(token) {
    const response = await apiRequest(`/api/invites/${token}/accept`, {
        method: 'POST'
    });

    return response.data;
}

export async function updateWorkspaceMemberRole(workspaceId, memberId, role) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
    });

    return response.data;
}

export async function removeWorkspaceMember(workspaceId, memberId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE'
    });

    return response.data;
}

export async function updateMyProfile(payload) {
    const response = await apiRequest('/api/profile/me', {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    return response.data.profile;
}

export async function bootstrapSession() {
    const response = await apiRequest('/api/session/bootstrap');
    return response.data;
}

export async function getPlans() {
    const response = await apiRequest('/api/plans');
    return response.data.plans;
}

export async function getBillingMe() {
    const response = await apiRequest('/api/billing/me');
    return response.data;
}

export async function selectFreePlan() {
    const response = await apiRequest('/api/billing/select-free', {
        method: 'POST'
    });
    return response.data;
}

export async function contactSales(payload) {
    const response = await apiRequest('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return response.data;
}

export async function createJoinLink(workspaceId, payload) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/join-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return response.data;
}

export async function getJoinLinkDetails(token) {
    const response = await apiRequest(`/api/join-links/${token}`);
    return response.data;
}

export async function requestWorkspaceAccess(token, payload) {
    const response = await apiRequest(`/api/join-links/${token}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return response.data;
}

export async function getJoinRequests(workspaceId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/join-requests`);
    return response.data.requests;
}

export async function approveJoinRequest(workspaceId, requestId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/join-requests/${requestId}/approve`, {
        method: 'POST'
    });
    return response.data;
}

export async function rejectJoinRequest(workspaceId, requestId) {
    const response = await apiRequest(`/api/workspaces/${workspaceId}/join-requests/${requestId}/reject`, {
        method: 'POST'
    });
    return response.data;
}