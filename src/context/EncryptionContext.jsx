import { createContext, useContext, useEffect, useState } from 'react';
import { useAppContext } from './AppContext';
import {
  generateUserKeyPair,
  exportPublicKeyJWK,
  importPublicKeyJWK,
  deriveWrappingKeyFromAnswer,
  encryptPrivateKey,
  decryptPrivateKey,
  generateWorkspaceKey,
  encryptWorkspaceKeyForUser,
  decryptWorkspaceKeyGrant,
  arrayBufferToBase64
} from '../services/e2eeCrypto';
import {
  getEncryptionIdentity,
  createEncryptionIdentity,
  patchRecoveryAnswer,
  resetEncryptionIdentity
} from '../services/encryptionIdentityApi';
import {
  getWorkspaceEncryptionStatus,
  initializeWorkspaceEncryption as initWorkspaceEnc,
  getMyWorkspaceKeyGrant,
  createWorkspaceKeyGrant,
  getWorkspaceMemberKeys
} from '../services/encryptionApi';

const EncryptionContext = createContext(null);

export function EncryptionProvider({ children }) {
  const { meta } = useAppContext();
  
  // Identity states
  const [encryptionIdentity, setEncryptionIdentity] = useState(null);
  const [isEncryptionIdentityLoaded, setIsEncryptionIdentityLoaded] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Keys in memory
  const [publicKey, setPublicKey] = useState(null);
  const [publicKeyJwk, setPublicKeyJwk] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  
  // Workspace E2EE states
  const [workspaceKey, setWorkspaceKey] = useState(null);
  const [workspaceKeyId, setWorkspaceKeyId] = useState(null);
  const [workspaceKeyVersion, setWorkspaceKeyVersion] = useState(null);
  const [isWorkspaceLocked, setIsWorkspaceLocked] = useState(false);
  const [isWorkspaceEncryptionEnabled, setIsWorkspaceEncryptionEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentWorkspaceId = meta && meta.currentWorkspaceId;
  const currentUserId = meta && meta.account && meta.account.id;

  // 1. Initialise and load user encryption identity metadata
  useEffect(() => {
    if (!currentUserId) {
      setEncryptionIdentity(null);
      setIsEncryptionIdentityLoaded(false);
      setIsUnlocked(false);
      setPublicKey(null);
      setPublicKeyJwk(null);
      setPrivateKey(null);
      setWorkspaceKey(null);
      setLoading(false);
      return;
    }

    async function loadIdentity() {
      try {
        setLoading(true);
        const result = await getEncryptionIdentity();
        const identity = result && result.identity;
        
        if (identity) {
          setEncryptionIdentity(identity);
          const pubKey = await importPublicKeyJWK(identity.publicKey);
          setPublicKey(pubKey);
          setPublicKeyJwk(identity.publicKey);
        } else {
          setEncryptionIdentity(null);
          setPublicKey(null);
          setPublicKeyJwk(null);
        }
      } catch (err) {
        console.error('Failed to load encryption identity:', err);
        setEncryptionIdentity(null);
        setPublicKey(null);
        setPublicKeyJwk(null);
      } finally {
        setIsEncryptionIdentityLoaded(true);
        setLoading(false);
      }
    }

    loadIdentity();
  }, [currentUserId]);

  // 2. Load workspace encryption symmetric key when workspace or keys change
  useEffect(() => {
    if (!currentWorkspaceId) {
      setWorkspaceKey(null);
      setWorkspaceKeyId(null);
      setWorkspaceKeyVersion(null);
      setIsWorkspaceLocked(false);
      setIsWorkspaceEncryptionEnabled(false);
      return;
    }

    let active = true;

    async function checkWorkspaceEncryption() {
      try {
        // Query status
        const statusResult = await getWorkspaceEncryptionStatus(currentWorkspaceId);
        const statusData = statusResult;
        const enabled = statusData && statusData.enabled;
        
        if (!active) return;
        setIsWorkspaceEncryptionEnabled(!!enabled);

        if (enabled) {
          // Encryption is enabled, get my grant
          const grantResult = await getMyWorkspaceKeyGrant(currentWorkspaceId);
          const grant = grantResult && grantResult.grant;
          
          if (!active) return;

          if (grant && grant.encrypted_workspace_key) {
            if (privateKey) {
              const wsKey = await decryptWorkspaceKeyGrant(grant.encrypted_workspace_key, privateKey);
              if (active) {
                setWorkspaceKey(wsKey);
                setWorkspaceKeyId(grant.workspace_key_id);
                
                const wKeys = grant.workspace_encryption_keys;
                if (wKeys) {
                  setWorkspaceKeyVersion(wKeys.key_version);
                }
                setIsWorkspaceLocked(false);
              }
            } else {
              // Encryption is enabled & grant exists, but private key is not unlocked in memory yet
              if (active) {
                setWorkspaceKey(null);
                setIsWorkspaceLocked(true);
              }
            }
          } else {
            // Workspace encryption enabled but no grant for this user (yet)
            if (active) {
              setWorkspaceKey(null);
              setIsWorkspaceLocked(true);
            }
          }
        } else {
          // Encryption not enabled for this workspace
          if (active) {
            setWorkspaceKey(null);
            setIsWorkspaceLocked(false);
          }
        }
      } catch (err) {
        console.error('Failed to load workspace encryption key:', err);
        if (active) {
          setWorkspaceKey(null);
          setIsWorkspaceLocked(true);
        }
      }
    }

    checkWorkspaceEncryption();

    return () => {
      active = false;
    };
  }, [currentWorkspaceId, privateKey]);

  // Unlock identity using recovery question answer
  const unlockIdentity = async (answer) => {
    if (!encryptionIdentity) {
      throw new Error('No encryption identity configured for this account');
    }
    
    // Derive wrapping key
    const wrappingKey = await deriveWrappingKeyFromAnswer(
      answer,
      encryptionIdentity.kdfSalt,
      encryptionIdentity.kdfIterations
    );

    // Decrypt private key
    const privKey = await decryptPrivateKey(
      encryptionIdentity.encryptedPrivateKey,
      encryptionIdentity.privateKeyIv,
      wrappingKey
    );

    setPrivateKey(privKey);
    setIsUnlocked(true);
    return true;
  };

  // Configure new encryption identity (first-time setup)
  const setupEncryptionIdentity = async (questionKey, questionText, answer) => {
    try {
      setLoading(true);
      
      // 1. Generate key pair
      const keyPair = await generateUserKeyPair();
      const pubKeyJwkString = await exportPublicKeyJWK(keyPair.publicKey);

      // 2. Generate random KDF salt
      const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
      const saltBase64 = arrayBufferToBase64(saltBytes);

      // 3. Derive wrapping key
      const wrappingKey = await deriveWrappingKeyFromAnswer(answer, saltBase64, 600000);

      // 4. Encrypt private key
      const encryptionResult = await encryptPrivateKey(keyPair.privateKey, wrappingKey);

      // 5. Save to backend
      const result = await createEncryptionIdentity({
        publicKey: pubKeyJwkString,
        encryptedPrivateKey: encryptionResult.encryptedPrivateKey,
        privateKeyIv: encryptionResult.iv,
        kdfSalt: saltBase64,
        kdfIterations: 600000,
        kdfAlgorithm: 'PBKDF2',
        keyAlgorithm: 'RSA-OAEP',
        recoveryQuestionKey: questionKey,
        recoveryQuestionText: questionText
      });

      const identity = result && result.identity;
      if (identity) {
        setEncryptionIdentity(identity);
        setPublicKey(keyPair.publicKey);
        setPublicKeyJwk(pubKeyJwkString);
        setPrivateKey(keyPair.privateKey);
        setIsUnlocked(true);
      }
      return true;
    } catch (err) {
      console.error('Failed to set up encryption identity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Change recovery question / answer
  const changeRecoveryAnswer = async (currentAnswer, newQuestionKey, newQuestionText, newAnswer) => {
    try {
      setLoading(true);
      
      let unlockedPrivateKey = privateKey;
      if (!isUnlocked || !unlockedPrivateKey) {
        // Unlock first
        const wrappingKey = await deriveWrappingKeyFromAnswer(
          currentAnswer,
          encryptionIdentity.kdfSalt,
          encryptionIdentity.kdfIterations
        );
        unlockedPrivateKey = await decryptPrivateKey(
          encryptionIdentity.encryptedPrivateKey,
          encryptionIdentity.privateKeyIv,
          wrappingKey
        );
      }

      // Generate new salt and re-encrypt private key with new answer
      const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
      const saltBase64 = arrayBufferToBase64(saltBytes);
      const newWrappingKey = await deriveWrappingKeyFromAnswer(newAnswer, saltBase64, 600000);
      const encryptionResult = await encryptPrivateKey(unlockedPrivateKey, newWrappingKey);

      // Update backend
      const result = await patchRecoveryAnswer({
        encryptedPrivateKey: encryptionResult.encryptedPrivateKey,
        privateKeyIv: encryptionResult.iv,
        kdfSalt: saltBase64,
        kdfIterations: 600000,
        recoveryQuestionKey: newQuestionKey,
        recoveryQuestionText: newQuestionText
      });

      const identity = result && result.identity;
      if (identity) {
        setEncryptionIdentity(identity);
        setPrivateKey(unlockedPrivateKey);
        setIsUnlocked(true);
      }
      return true;
    } catch (err) {
      console.error('Failed to change recovery answer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset E2EE identity (dangerous reset flow)
  const resetIdentity = async () => {
    try {
      setLoading(true);
      await resetEncryptionIdentity();
      setEncryptionIdentity(null);
      setIsUnlocked(false);
      setPublicKey(null);
      setPublicKeyJwk(null);
      setPrivateKey(null);
      setWorkspaceKey(null);
      setWorkspaceKeyId(null);
      setWorkspaceKeyVersion(null);
      setIsWorkspaceLocked(false);
      setIsWorkspaceEncryptionEnabled(false);
    } catch (err) {
      console.error('Failed to reset encryption identity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize workspace encryption (Owner symmetric key generation)
  const initializeWorkspaceEncryption = async () => {
    if (!currentWorkspaceId || !publicKey || !currentUserId) {
      throw new Error('Missing encryption credentials or workspace context');
    }

    try {
      const aesKey = await generateWorkspaceKey();
      const wrappedKey = await encryptWorkspaceKeyForUser(aesKey, publicKey);

      const result = await initWorkspaceEnc(currentWorkspaceId, {
        keyAlgorithm: 'AES-GCM',
        encryptedWorkspaceKey: wrappedKey,
        grantAlgorithm: 'RSA-OAEP'
      });

      const grant = result && result.grant;
      if (grant) {
        setWorkspaceKey(aesKey);
        setWorkspaceKeyId(grant.workspace_key_id);
        setWorkspaceKeyVersion(1);
        setIsWorkspaceLocked(false);
        setIsWorkspaceEncryptionEnabled(true);
        return aesKey;
      }
    } catch (err) {
      console.error('Failed to initialize workspace encryption:', err);
      throw err;
    }
  };

  // Grant access to a new user
  const grantWorkspaceKeyAccess = async (targetUserId, targetPublicKeyJwkString) => {
    if (!workspaceKey || !currentWorkspaceId) {
      throw new Error('Workspace key is not unlocked in memory');
    }

    try {
      const targetPublicKey = await importPublicKeyJWK(targetPublicKeyJwkString);
      const wrappedKey = await encryptWorkspaceKeyForUser(workspaceKey, targetPublicKey);

      await createWorkspaceKeyGrant(currentWorkspaceId, {
        keyVersion: workspaceKeyVersion || 1,
        keyAlgorithm: 'AES-GCM',
        recipientUserId: targetUserId,
        encryptedWorkspaceKey: wrappedKey,
        grantAlgorithm: 'RSA-OAEP'
      });
      console.log('Granted workspace key access to user:', targetUserId);
    } catch (err) {
      console.error('Failed to grant workspace key access:', err);
      throw err;
    }
  };

  return (
    <EncryptionContext.Provider
      value={{
        encryptionIdentity,
        isEncryptionIdentityLoaded,
        isUnlocked,
        publicKey,
        publicKeyJwk,
        privateKey,
        workspaceKey,
        workspaceKeyId,
        workspaceKeyVersion,
        isWorkspaceLocked,
        isWorkspaceEncryptionEnabled,
        loading,
        unlockIdentity,
        setupEncryptionIdentity,
        changeRecoveryAnswer,
        resetIdentity,
        initializeWorkspaceEncryption,
        grantWorkspaceKeyAccess
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}
