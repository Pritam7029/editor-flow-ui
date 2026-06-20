import { supabase } from '../config/supabaseclient';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function getAccessToken() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        throw new Error(error.message || 'Failed to get Supabase session');
    }

    const token =
        data && data.session && data.session.access_token ?
        data.session.access_token :
        null;

    if (!token) {
        throw new Error('No active session found');
    }

    return token;
}

export async function apiRequest(path, options = {}) {
    const token = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMessage =
            (payload && payload.message) ||
            (payload && payload.error) ||
            `Request failed with status ${response.status}`;

        throw new Error(errorMessage);
    }

    return payload;
}