import { apiRequest } from './apiClient';

export async function getMyProfile() {
    const response = await apiRequest('/api/profile/me');
    return response.data;
}

export async function updateMyProfile(payload) {
    const response = await apiRequest('/api/profile/me', {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
    return response.data.profile;
}

export async function initAvatarUpload(payload) {
    const response = await apiRequest('/api/profile/avatar/init-upload', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return response.data;
}

export async function completeAvatarUpload(payload) {
    const response = await apiRequest('/api/profile/avatar/complete-upload', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return response.data.profile;
}
