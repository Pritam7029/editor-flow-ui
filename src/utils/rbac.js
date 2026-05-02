export function isAdmin(senderId, workspace) {
  return senderId === workspace.ownerId;
}

export function canManageEditors(senderId, workspace) {
  return isAdmin(senderId, workspace);
}

export function isFileVisible(file, senderId, workspace) {
  if (isAdmin(senderId, workspace)) return true;
  if (file.uploadedBy === senderId) return true;
  if (file.visibleTo && file.visibleTo.includes(senderId)) return true;
  return false;
}
