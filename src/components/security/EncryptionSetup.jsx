import { useState, useEffect } from 'react';
import { useEncryption } from '../../context/EncryptionContext';
import { useAppContext } from '../../context/AppContext';
import { Key, Eye, EyeOff, Shield, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

const STANDARD_QUESTIONS = [
  { key: 'pet', text: 'What was the name of your first pet?' },
  { key: 'city', text: 'In what city were you born?' },
  { key: 'nickname', text: 'What was your childhood nickname?' },
  { key: 'book', text: 'What is the name of your favorite book?' },
  { key: 'custom', text: 'Write your own custom question...' }
];

export default function EncryptionSetup() {
  const { setupEncryptionIdentity, loading } = useEncryption();
  const { meta } = useAppContext();

  const [selectedQuestionKey, setSelectedQuestionKey] = useState(STANDARD_QUESTIONS[0].key);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState(null);
  
  // Validation / strength state
  const [lengthValid, setLengthValid] = useState(false);
  const [isCommonWeak, setIsCommonWeak] = useState(false);
  const [containsUserInfo, setContainsUserInfo] = useState(false);
  const [strength, setStrength] = useState('weak'); // weak, medium, strong

  const account = meta && meta.account;
  const email = account && account.email;
  const name = account && account.name;

  useEffect(() => {
    // Length check (>= 16 characters)
    const isLengthValid = answer.length >= 16;
    setLengthValid(isLengthValid);

    if (answer.length === 0) {
      setIsCommonWeak(false);
      setContainsUserInfo(false);
      setStrength('weak');
      return;
    }

    // Common weak words check
    const lowerAnswer = answer.toLowerCase();
    const weakPatterns = ['password', '123456', 'editorflow', 'qwerty', 'admin123'];
    const hasWeakPattern = weakPatterns.some(pattern => lowerAnswer.includes(pattern));
    setIsCommonWeak(hasWeakPattern);

    // User info check
    let hasUserInfo = false;
    if (email) {
      const emailLocal = email.split('@')[0].toLowerCase();
      if (emailLocal.length > 3 && lowerAnswer.includes(emailLocal)) {
        hasUserInfo = true;
      }
    }
    if (name) {
      const nameParts = name.toLowerCase().split(/\s+/);
      for (let i = 0; i < nameParts.length; i++) {
        const part = nameParts[i];
        if (part.length > 2 && lowerAnswer.includes(part)) {
          hasUserInfo = true;
        }
      }
    }
    setContainsUserInfo(hasUserInfo);

    // Derive strength
    if (!isLengthValid) {
      setStrength('weak');
    } else if (hasWeakPattern || hasUserInfo) {
      setStrength('medium');
    } else {
      // Calculate entropy slightly
      const hasUppercase = /[A-Z]/.test(answer);
      const hasNumber = /[0-9]/.test(answer);
      const hasSpecial = /[^A-Za-z0-9]/.test(answer);
      const uniqueChars = new Set(answer.split('')).size;

      if (uniqueChars >= 10 && (hasUppercase || hasNumber || hasSpecial)) {
        setStrength('strong');
      } else {
        setStrength('medium');
      }
    }
  }, [answer, email, name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!lengthValid) {
      setError('Recovery answer must be at least 16 characters long.');
      return;
    }

    let finalQuestionText = '';
    if (selectedQuestionKey === 'custom') {
      if (!customQuestionText.trim()) {
        setError('Please write your custom question.');
        return;
      }
      finalQuestionText = customQuestionText.trim();
    } else {
      const q = STANDARD_QUESTIONS.find(item => item.key === selectedQuestionKey);
      finalQuestionText = q ? q.text : '';
    }

    try {
      await setupEncryptionIdentity(selectedQuestionKey, finalQuestionText, answer);
    } catch (err) {
      setError(err.message || 'Failed to set up encryption identity. Please try again.');
    }
  };

  const getStrengthColor = () => {
    if (strength === 'strong') return '#10b981'; // emerald
    if (strength === 'medium') return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  const getStrengthText = () => {
    if (strength === 'strong') return 'Strong - Perfect for recovery';
    if (strength === 'medium') return 'Medium - Try avoiding common patterns/names';
    return 'Weak - Must be at least 16 characters';
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <Shield size={32} color="var(--violet)" />
          </div>
          <h2 style={styles.title}>Secure Your Workspace</h2>
          <p style={styles.subtitle}>
            EditorFlow uses End-to-End Encryption (E2EE) to secure your communications. 
            Set up a recovery question to encrypt and protect your private keys.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Select Recovery Question</label>
            <select
              value={selectedQuestionKey}
              onChange={(e) => setSelectedQuestionKey(e.target.value)}
              style={styles.select}
              disabled={loading}
            >
              {STANDARD_QUESTIONS.map((q) => (
                <option key={q.key} value={q.key} style={styles.option}>
                  {q.text}
                </option>
              ))}
            </select>
          </div>

          {selectedQuestionKey === 'custom' && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Write Your Custom Question</label>
              <input
                type="text"
                value={customQuestionText}
                onChange={(e) => setCustomQuestionText(e.target.value)}
                placeholder="e.g. What was the name of the street I grew up on?"
                style={styles.input}
                required
                disabled={loading}
              />
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Recovery Answer</label>
            <div style={styles.inputContainer}>
              <input
                type={showAnswer ? 'text' : 'password'}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Minimum 16 characters recovery sentence"
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

          {/* Validation Feedback Panels */}
          <div style={styles.feedbackContainer}>
            <div style={styles.feedbackRow}>
              {lengthValid ? (
                <CheckCircle2 size={16} color="var(--emerald)" />
              ) : (
                <AlertCircle size={16} color="var(--text-muted)" />
              )}
              <span style={lengthValid ? styles.feedbackTextValid : styles.feedbackTextInvalid}>
                At least 16 characters long (currently {answer.length})
              </span>
            </div>

            {answer.length > 0 && (
              <div style={styles.strengthIndicator}>
                <div style={styles.strengthBarBg}>
                  <div
                    style={{
                      ...styles.strengthBarFill,
                      width: strength === 'strong' ? '100%' : strength === 'medium' ? '60%' : '20%',
                      backgroundColor: getStrengthColor()
                    }}
                  />
                </div>
                <span style={{ ...styles.strengthLabel, color: getStrengthColor() }}>
                  {getStrengthText()}
                </span>
              </div>
            )}

            {isCommonWeak && (
              <div style={styles.warningBox}>
                <ShieldAlert size={16} color="var(--amber)" style={styles.warningIcon} />
                <span>Avoid simple strings like "password", "123456", or "editorflow".</span>
              </div>
            )}

            {containsUserInfo && (
              <div style={styles.warningBox}>
                <ShieldAlert size={16} color="var(--amber)" style={styles.warningIcon} />
                <span>Avoid using parts of your email address or name in the answer.</span>
              </div>
            )}
          </div>

          {error && <div style={styles.errorText}>{error}</div>}

          <button
            type="submit"
            disabled={loading || !lengthValid}
            style={{
              ...styles.submitButton,
              opacity: (loading || !lengthValid) ? 0.6 : 1,
              cursor: (loading || !lengthValid) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Initializing Identity...' : 'Initialize Encryption Identity'}
          </button>
        </form>
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
    maxWidth: '520px',
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
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
    cursor: 'pointer'
  },
  option: {
    background: '#0f172a',
    color: 'var(--text-primary)'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s'
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
    transition: 'color 0.2s, background-color 0.2s',
    ':hover': {
      color: 'var(--text-primary)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  },
  feedbackContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.03)'
  },
  feedbackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  feedbackTextValid: {
    fontSize: '13px',
    color: 'var(--emerald)'
  },
  feedbackTextInvalid: {
    fontSize: '13px',
    color: 'var(--text-muted)'
  },
  strengthIndicator: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '4px'
  },
  strengthBarBg: {
    height: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease, background-color 0.3s ease'
  },
  strengthLabel: {
    fontSize: '11px',
    fontWeight: '600'
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    padding: '8px 10px',
    borderRadius: '6px',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    border: '1px solid rgba(245, 158, 11, 0.15)'
  },
  warningIcon: {
    flexShrink: 0,
    marginTop: '1px'
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
  }
};
