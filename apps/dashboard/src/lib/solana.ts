import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

export interface WalletProvider {
    publicKey: PublicKey | null;
    isConnected: boolean;
    signMessage: (message: Uint8Array) => Promise<Uint8Array>;
    connect: () => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
}

export const getPhantomProvider = (): WalletProvider | null => {
    if ('solana' in window) {
        const provider = (window as any).solana;
        if (provider.isPhantom) {
            return provider as WalletProvider;
        }
    }
    return null;
};

export const connectWallet = async (): Promise<string | null> => {
    const provider = getPhantomProvider();
    if (provider) {
        try {
            const { publicKey } = await provider.connect();
            return publicKey.toString();
        } catch (err) {
            console.error(err);
            return null;
        }
    } else {
        window.open('https://phantom.app/', '_blank');
        return null;
    }
};
