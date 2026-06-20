import { useState } from 'react';
import { useEncryption } from '../../context/EncryptionContext';
import { Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';

export default function UnlockEncryption() {
  const { encryptionIdentity, unlockIdentity, resetIdentity, loading } = useEncryption();
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState(null);
  const [showResetWarning, setShowResetWarning] = useState(false);

  const recoveryQuestion = encryptionIdentity && encryptionIdentity.recoveryQuestionText 
    ? encryptionIdentity.recoveryQuestionText 
    : 'Your custom recovery question';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!answer.trim()) {
      setError('Please enter your recovery answer.');
      return;
    }

    try {
      await unlockIdentity(answer);
    } catch (err) {
      setError(err.message || 'Incorrect recovery answer. Please try again.');
    }
  };

  const handleReset = async () => {
    try {
      setError(null);
      await resetIdentity();
    } catch (err) {
      setError(err.message || 'Failed to reset encryption identity.');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <KeyRound size={32} color="var(--violet)" />
          </div>
          <h2 style={styles.title}>Unlock Chat Encryption</h2>
          <p style={styles.subtitle}>
            Enter your recovery answer to unlock your private key and decrypt workspace chat history.
          </p>
        </div>

        {!showResetWarning ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.questionBox}>
              <span style={styles.questionLabel}>Security Question:</span>
              <p style={styles.questionText}>{recoveryQuestion}</p>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Your Recovery Answer</label>
              <div style={styles.inputContainer}>
                <input
                  type={showAnswer ? 'text' : 'password'}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter your security answer..."
                  style={styles.inputWithIcon}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAnswer(!showAnswer)}
                  style={styles.eyeButton}
                  title={showAnswer ? 'Hide answer' : 'Show answer'}
                >
                  {showAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div style={styles.errorText}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Unlocking...' : 'Unlock Session'}
            </button>

            <button
              type="button"
              onClick={() => setShowResetWarning(true)}
              style={styles.forgotLink}
            >
              Forgot recovery answer?
            </button>
          </form>
        ) : (
          <div style={styles.resetContainer}>
            <div style={styles.warningAlert}>
              <ShieldAlert size={24} color="var(--rose)" style={styles.alertIcon} />
              <div style={styles.alertContent}>
                <h4 style={styles.alertTitle}>Reset Encryption Identity</h4>
                <p style={styles.alertDescription}>
                  Resetting will delete your current public/private key pair and create a new one. 
                  <strong> You will not be able to decrypt past encrypted chat history in any workspace.</strong>
                </p>
              </div>
            </div>

            <p style={styles.resetNotice}>
              If you have lost your recovery answer, resetting is the only way to send and receive new encrypted chats in the future.
            </p>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => setShowResetWarning(false)}
                style={styles.cancelButton}
                disabled={loading}
              >
                Back to Unlock
              </button>
              <button
                type="button"
                onClick={handleReset}
                style={styles.resetButton}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Yes, Reset My Identity'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    backdropFilter: 'blur(16px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.1)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    color: 'var(--text-primary)'
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    background: 'linear-gradient(to right, #f1f5f9, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--text-secondary)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  questionBox: {
    padding: '16px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.15)'
  },
  questionLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--violet)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  questionText: {
    margin: '6px 0 0 0',
    fontSize: '15px',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputWithIcon: {
    width: '100%',
    padding: '12px 48px 12px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  eyeButton: {
    position: 'absolute',
    right: '4px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: '50%',
    transition: 'color 0.2s, background-color 0.2s'
  },
  errorText: {
    fontSize: '14px',
    color: 'var(--rose)',
    textAlign: 'center',
    background: 'rgba(244, 63, 94, 0.05)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    padding: '10px',
    borderRadius: 'var(--radius-sm)'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    borderRadius: 'var(--radius-sm)',
    background: 'linear-gradient(135deg, var(--violet), #7c3aed)',
    color: '#fff',
    border: 'none',
    fontWeight: '600',
    fontSize: '15px',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
    transition: 'transform 0.1s, box-shadow 0.2s'
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    alignSelf: 'center',
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'color 0.2s',
    ':hover': {
      color: 'var(--violet)'
    }
  },
  resetContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  warningAlert: {
    display: 'flex',
    gap: '14px',
    padding: '16px',
    backgroundColor: 'rgba(244, 63, 94, 0.06)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
    borderRadius: 'var(--radius-sm)'
  },
  alertIcon: {
    flexShrink: 0,
    marginTop: '2px'
  },
  alertContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  alertTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--rose)'
  },
  alertDescription: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'var(--text-secondary)'
  },
  resetNotice: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    textAlign: 'center'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-primary)',
    fontWeight: '600',
    transition: 'background-color 0.2s'
  },
  resetButton: {
    flex: 1,
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--rose)',
    color: '#fff',
    border: 'none',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    ':hover': {
      background: '#e11d48'
    }
  }
};
