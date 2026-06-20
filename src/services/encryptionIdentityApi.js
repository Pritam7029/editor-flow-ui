import { apiRequest } from './apiClient';

export async function getEncryptionIdentity() {
  const response = await apiRequest('/api/encryption/identity');
  return response.data;
}

export async function createEncryptionIdentity(identityData) {
  const response = await apiRequest('/api/encryption/identity', {
    method: 'POST',
    body: JSON.stringify(identityData),
  });
  return response.data;
}

export async function patchRecoveryAnswer(patchData) {
  const response = await apiRequest('/api/encryption/identity/recovery-answer', {
    method: 'PATCH',
    body: JSON.stringify(patchData),
  });
  return response.data;
}

export async function resetEncryptionIdentity() {
  const response = await apiRequest('/api/encryption/identity', {
    method: 'DELETE',
  });
  return response.data;
}
