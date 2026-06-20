import { apiRequest } from './apiClient';

export async function getWorkspaceEncryptionStatus(workspaceId) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/encryption/status`);
  return response.data;
}

export async function initializeWorkspaceEncryption(workspaceId, initData) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/encryption/initialize`, {
    method: 'POST',
    body: JSON.stringify(initData),
  });
  return response.data;
}

export async function getWorkspaceKeyGrants(workspaceId) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/encryption/grants`);
  return response.data;
}

export async function createWorkspaceKeyGrant(workspaceId, grantData) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/encryption/grants`, {
    method: 'POST',
    body: JSON.stringify(grantData),
  });
  return response.data;
}

export async function getMyWorkspaceKeyGrant(workspaceId) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/encryption/my-grant`);
  return response.data;
}

export async function getWorkspaceMemberKeys(workspaceId) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/encryption/keys`);
  return response.data.keys;
}

export async function rotateWorkspaceKey(workspaceId, rotateData) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/encryption/rotate-key`, {
    method: 'POST',
    body: JSON.stringify(rotateData),
  });
  return response.data;
}
