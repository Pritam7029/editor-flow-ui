import {
    getWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace
} from './workspaceApi';

export async function loadBackendWorkspaceMeta() {
    const workspaces = await getWorkspaces();

    return workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        role: workspace.role,
        status: workspace.status,
        ownerId: workspace.owner_id,
        membershipId: workspace.membership_id,
        joinedAt: workspace.joined_at,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at
    }));
}

export async function createBackendWorkspace(name) {
    const workspace = await createWorkspace(name);

    return {
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.owner_id,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at
    };
}

export async function renameBackendWorkspace(workspaceId, name) {
    const workspace = await updateWorkspace(workspaceId, name);

    return {
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.owner_id,
        createdAt: workspace.created_at,
        updatedAt: workspace.updated_at
    };
}

export async function removeBackendWorkspace(workspaceId) {
    await deleteWorkspace(workspaceId);

    return true;
}