import { apiRequest } from './apiClient';

export async function registerDeviceKey({ deviceName, publicKey, algorithm }) {
  const response = await apiRequest('/api/device-keys', {
    method: 'POST',
    body: JSON.stringify({ deviceName, publicKey, algorithm }),
  });
  return response.data;
}

export async function getMyDeviceKeys() {
  const response = await apiRequest('/api/device-keys/me');
  return response.data;
}

export async function revokeDeviceKey(deviceKeyId) {
  const response = await apiRequest(`/api/device-keys/${deviceKeyId}/revoke`, {
    method: 'PATCH',
  });
  return response.data;
}
