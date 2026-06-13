import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseclient';
import { useAppContext } from './AppContext';
import {
  generateDeviceKeyPair,
  exportPublicKeyJWK,
  getLocalDeviceKeyId,
  setLocalDeviceKeyId,
  getLocalPrivateKey,
  getLocalPublicKey,
  storeLocalKeyPair,
  unwrapWorkspaceKey,
  generateWorkspaceKey,
  wrapWorkspaceKey,
  importPublicKeyJWK
} from '../services/e2eeCrypto';
import { registerDeviceKey, getMyDeviceKeys } from '../services/deviceKeyApi';
import { getMyWorkspaceKeyGrant, createWorkspaceKeyGrant, getWorkspaceKeyGrants } from '../services/encryptionApi';

const EncryptionContext = createContext(null);

export function EncryptionProvider({ children }) {
  const { meta } = useAppContext();
  const [deviceKeyId, setDeviceKeyId] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [workspaceKey, setWorkspaceKey] = useState(null);
  const [workspaceKeyId, setWorkspaceKeyId] = useState(null);
  const [workspaceKeyVersion, setWorkspaceKeyVersion] = useState(null);
  const [isWorkspaceLocked, setIsWorkspaceLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentWorkspaceId = meta && meta.currentWorkspaceId;
  const currentUserId = meta && meta.account && meta.account.id;

  // 1. Initialise device key pair
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    async function initDeviceKey() {
      try {
        let localKeyId = await getLocalDeviceKeyId();
        let localPrivate = await getLocalPrivateKey();
        let localPublic = await getLocalPublicKey();

        if (!localKeyId || !localPrivate || !localPublic) {
          console.log('No local device key found. Generating new key pair...');
          const keyPair = await generateDeviceKeyPair();
          const jwk = await exportPublicKeyJWK(keyPair.publicKey);
          
          const deviceName = 'Browser - ' + navigator.userAgent.slice(0, 30);
          const regResult = await registerDeviceKey({
            deviceName,
            publicKey: jwk,
            algorithm: 'RSA-OAEP'
          });

          const registeredKey = regResult && regResult.deviceKey;
          if (registeredKey && registeredKey.id) {
            await setLocalDeviceKeyId(registeredKey.id);
            await storeLocalKeyPair(keyPair.privateKey, keyPair.publicKey);
            
            localKeyId = registeredKey.id;
            localPrivate = keyPair.privateKey;
            localPublic = keyPair.publicKey;
          }
        }

        setDeviceKeyId(localKeyId);
        setPrivateKey(localPrivate);
        setPublicKey(localPublic);
      } catch (err) {
        console.error('Failed to initialize E2EE device key:', err);
      } finally {
        setLoading(false);
      }
    }

    initDeviceKey();
  }, [currentUserId]);

  // 2. Load workspace key grant when workspace or deviceKey changes
  useEffect(() => {
    if (!currentWorkspaceId || !deviceKeyId || !privateKey) {
      setWorkspaceKey(null);
      setWorkspaceKeyId(null);
      setWorkspaceKeyVersion(null);
      setIsWorkspaceLocked(false);
      return;
    }

    async function loadWorkspaceKey() {
      try {
        setIsWorkspaceLocked(false);
        const grantResult = await getMyWorkspaceKeyGrant(currentWorkspaceId, deviceKeyId);
        const grant = grantResult && grantResult.grant;

        if (grant && grant.encrypted_workspace_key) {
          const unwrapped = await unwrapWorkspaceKey(grant.encrypted_workspace_key, privateKey);
          setWorkspaceKey(unwrapped);
          setWorkspaceKeyId(grant.workspace_key_id);
          
          const keyDetails = grant.workspace_encryption_keys;
          if (keyDetails) {
            setWorkspaceKeyVersion(keyDetails.key_version);
          }
          setIsWorkspaceLocked(false);
        } else {
          // No grant found. This device is pending approval or workspace E2EE is not set up
          console.log('No key grant found for this device.');
          setWorkspaceKey(null);
          setWorkspaceKeyId(null);
          setWorkspaceKeyVersion(null);
          setIsWorkspaceLocked(true);
        }
      } catch (err) {
        console.error('Failed to unwrap workspace key:', err);
        setWorkspaceKey(null);
        setIsWorkspaceLocked(true);
      }
    }

    loadWorkspaceKey();
  }, [currentWorkspaceId, deviceKeyId, privateKey]);

  // Setup/Initialize Workspace Key (Owner flow)
  const initializeWorkspaceEncryption = async () => {
    if (!currentWorkspaceId || !publicKey || !currentUserId || !deviceKeyId) {
      throw new Error('Missing encryption state or workspace credentials');
    }

    try {
      console.log('Generating new workspace symmetric key...');
      const aesKey = await generateWorkspaceKey();
      const wrappedKey = await wrapWorkspaceKey(aesKey, publicKey);

      const grantData = {
        keyVersion: 1,
        keyAlgorithm: 'AES-GCM',
        userId: currentUserId,
        deviceKeyId: deviceKeyId,
        encryptedWorkspaceKey: wrappedKey,
        grantAlgorithm: 'RSA-OAEP'
      };

      const result = await createWorkspaceKeyGrant(currentWorkspaceId, grantData);
      const grant = result && result.grant;
      if (grant) {
        setWorkspaceKey(aesKey);
        setWorkspaceKeyId(grant.workspace_key_id);
        setWorkspaceKeyVersion(1);
        setIsWorkspaceLocked(false);
        return aesKey;
      }
    } catch (err) {
      console.error('Failed to initialize workspace encryption:', err);
      throw err;
    }
  };

  // Grant access to a new user device
  const grantWorkspaceKeyAccess = async (targetUserId, targetDeviceKeyId, targetPublicKeyJwk) => {
    if (!workspaceKey || !currentWorkspaceId) {
      throw new Error('Workspace key is not unlocked on this device');
    }

    try {
      const parsedPublicKey = await importPublicKeyJWK(targetPublicKeyJwk);
      const wrappedKey = await wrapWorkspaceKey(workspaceKey, parsedPublicKey);

      const grantData = {
        keyVersion: workspaceKeyVersion || 1,
        keyAlgorithm: 'AES-GCM',
        userId: targetUserId,
        deviceKeyId: targetDeviceKeyId,
        encryptedWorkspaceKey: wrappedKey,
        grantAlgorithm: 'RSA-OAEP'
      };

      await createWorkspaceKeyGrant(currentWorkspaceId, grantData);
      console.log(`Successfully granted key access to user ${targetUserId} device ${targetDeviceKeyId}`);
    } catch (err) {
      console.error('Failed to grant workspace key access:', err);
      throw err;
    }
  };

  return (
    <EncryptionContext.Provider
      value={{
        deviceKeyId,
        publicKey,
        privateKey,
        workspaceKey,
        workspaceKeyId,
        workspaceKeyVersion,
        isWorkspaceLocked,
        loading,
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
