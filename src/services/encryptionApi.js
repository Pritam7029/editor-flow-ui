import { apiRequest } from './apiClient';

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

export async function getMyWorkspaceKeyGrant(workspaceId, deviceKeyId) {
  const response = await apiRequest(`/api/workspaces/${workspaceId}/encryption/my-grant?deviceKeyId=${deviceKeyId}`);
  return response.data;
}

export async function getWorkspaceDeviceKeys(workspaceId) {
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
