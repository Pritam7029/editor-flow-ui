import { useState, useEffect } from 'react';
import { useEncryption } from '../../context/EncryptionContext';
import { useAppContext } from '../../context/AppContext';
import { Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

const STANDARD_QUESTIONS = [
  { key: 'pet', text: 'What was the name of your first pet?' },
  { key: 'city', text: 'In what city were you born?' },
  { key: 'nickname', text: 'What was your childhood nickname?' },
  { key: 'book', text: 'What is the name of your favorite book?' },
  { key: 'custom', text: 'Write your own custom question...' }
];

export default function ChangeRecoveryAnswer({ onCancel, onSuccess }) {
  const { changeRecoveryAnswer, loading } = useEncryption();
  const { meta } = useAppContext();

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedQuestionKey, setSelectedQuestionKey] = useState(STANDARD_QUESTIONS[0].key);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Validation / strength state for new answer
  const [lengthValid, setLengthValid] = useState(false);
  const [isCommonWeak, setIsCommonWeak] = useState(false);
  const [containsUserInfo, setContainsUserInfo] = useState(false);
  const [strength, setStrength] = useState('weak');

  const account = meta && meta.account;
  const email = account && account.email;
  const name = account && account.name;

  useEffect(() => {
    const isLengthValid = newAnswer.length >= 16;
    setLengthValid(isLengthValid);

    if (newAnswer.length === 0) {
      setIsCommonWeak(false);
      setContainsUserInfo(false);
      setStrength('weak');
      return;
    }

    const lowerAnswer = newAnswer.toLowerCase();
    const weakPatterns = ['password', '123456', 'editorflow', 'qwerty', 'admin123'];
    const hasWeakPattern = weakPatterns.some(pattern => lowerAnswer.includes(pattern));
    setIsCommonWeak(hasWeakPattern);

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

    if (!isLengthValid) {
      setStrength('weak');
    } else if (hasWeakPattern || hasUserInfo) {
      setStrength('medium');
    } else {
      const hasUppercase = /[A-Z]/.test(newAnswer);
      const hasNumber = /[0-9]/.test(newAnswer);
      const hasSpecial = /[^A-Za-z0-9]/.test(newAnswer);
      const uniqueChars = new Set(newAnswer.split('')).size;

      if (uniqueChars >= 10 && (hasUppercase || hasNumber || hasSpecial)) {
        setStrength('strong');
      } else {
        setStrength('medium');
      }
    }
  }, [newAnswer, email, name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!currentAnswer.trim()) {
      setError('Please enter your current recovery answer.');
      return;
    }

    if (!lengthValid) {
      setError('New recovery answer must be at least 16 characters long.');
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
      await changeRecoveryAnswer(currentAnswer, selectedQuestionKey, finalQuestionText, newAnswer);
      setSuccessMsg('Recovery question and answer updated successfully.');
      setCurrentAnswer('');
      setNewAnswer('');
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to update recovery settings. Check your current answer.');
    }
  };

  const getStrengthColor = () => {
    if (strength === 'strong') return '#10b981';
    if (strength === 'medium') return '#f59e0b';
    return '#f43f5e';
  };

  const getStrengthText = () => {
    if (strength === 'strong') return 'Strong - Perfect for recovery';
    if (strength === 'medium') return 'Medium - Try avoiding common patterns/names';
    return 'Weak - Must be at least 16 characters';
  };

  return (
    <div style={styles.container}>
      <div style={styles.formHeader}>
        <ShieldCheck size={24} color="var(--violet)" />
        <h3 style={styles.formTitle}>Change Recovery Question / Answer</h3>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Current Recovery Answer</label>
          <div style={styles.inputContainer}>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Confirm current answer to verify"
              style={styles.inputWithIcon}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              style={styles.eyeButton}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <hr style={styles.divider} />

        <div style={styles.fieldGroup}>
          <label style={styles.label}>New Recovery Question</label>
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
            <label style={styles.label}>Write Your New Custom Question</label>
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
          <label style={styles.label}>New Recovery Answer</label>
          <div style={styles.inputContainer}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Minimum 16 characters new sentence"
              style={styles.inputWithIcon}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              style={styles.eyeButton}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Validation Feedback */}
        <div style={styles.feedbackContainer}>
          <div style={styles.feedbackRow}>
            {lengthValid ? (
              <CheckCircle2 size={14} color="var(--emerald)" />
            ) : (
              <AlertCircle size={14} color="var(--text-muted)" />
            )}
            <span style={lengthValid ? styles.feedbackTextValid : styles.feedbackTextInvalid}>
              At least 16 characters long (currently {newAnswer.length})
            </span>
          </div>

          {newAnswer.length > 0 && (
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
              <ShieldAlert size={14} color="var(--amber)" style={styles.warningIcon} />
              <span>Avoid simple strings like "password", "123456", or "editorflow".</span>
            </div>
          )}

          {containsUserInfo && (
            <div style={styles.warningBox}>
              <ShieldAlert size={14} color="var(--amber)" style={styles.warningIcon} />
              <span>Avoid using parts of your email address or name in the answer.</span>
            </div>
          )}
        </div>

        {error && <div style={styles.errorText}>{error}</div>}
        {successMsg && <div style={styles.successText}>{successMsg}</div>}

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !lengthValid}
            style={{
              ...styles.submitButton,
              opacity: (loading || !lengthValid) ? 0.6 : 1,
              cursor: (loading || !lengthValid) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Saving Changes...' : 'Update Recovery Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  formTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  },
  divider: {
    border: '0',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    margin: '8px 0'
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-primary)',
    outline: 'none',
    cursor: 'pointer'
  },
  option: {
    background: '#0f172a',
    color: 'var(--text-primary)'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputWithIcon: {
    width: '100%',
    padding: '10px 40px 10px 14px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  eyeButton: {
    position: 'absolute',
    right: '4px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  feedbackContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.02)'
  },
  feedbackRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  feedbackTextValid: {
    fontSize: '12px',
    color: 'var(--emerald)'
  },
  feedbackTextInvalid: {
    fontSize: '12px',
    color: 'var(--text-muted)'
  },
  strengthIndicator: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '2px'
  },
  strengthBarBg: {
    height: '3px',
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
    fontSize: '10px',
    fontWeight: '600'
  },
  warningBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    padding: '6px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.1)'
  },
  warningIcon: {
    flexShrink: 0,
    marginTop: '1px'
  },
  errorText: {
    fontSize: '13px',
    color: 'var(--rose)',
    textAlign: 'center',
    background: 'rgba(244, 63, 94, 0.04)',
    border: '1px solid rgba(244, 63, 94, 0.12)',
    padding: '8px',
    borderRadius: 'var(--radius-sm)'
  },
  successText: {
    fontSize: '13px',
    color: 'var(--emerald)',
    textAlign: 'center',
    background: 'rgba(16, 185, 129, 0.04)',
    border: '1px solid rgba(16, 185, 129, 0.12)',
    padding: '8px',
    borderRadius: 'var(--radius-sm)'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px'
  },
  cancelButton: {
    flex: '1',
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  submitButton: {
    flex: '2',
    padding: '10px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--violet)',
    color: '#fff',
    border: 'none',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
  }
};
