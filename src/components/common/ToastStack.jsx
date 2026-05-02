import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

export default function ToastStack() {
  const { workspace, removeToast } = useAppContext();

  useEffect(() => {
    const timers = (workspace.toasts || []).map((toast) => setTimeout(() => removeToast(toast.id), 3200));
    return () => timers.forEach(clearTimeout);
  }, [workspace.toasts, removeToast]);

  return (
    <div className="toast-stack">
      {(workspace.toasts || []).map((toast) => (
        <div className={`toast-item toast-${toast.tone}`} key={toast.id}>{toast.message}</div>
      ))}
    </div>
  );
}
