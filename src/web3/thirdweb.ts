import { createThirdwebClient } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";
import { baseSepolia } from "thirdweb/chains";

// Thirdweb Client ID from environment variable with fallback
export const THIRDWEB_CLIENT_ID =
  (import.meta.env.VITE_THIRDWEB_CLIENT_ID as string) || "9e7d692dd5b03ca85a3c6df67db324b1";

export const thirdwebClient = createThirdwebClient({
  clientId: THIRDWEB_CLIENT_ID,
});

// In-app wallet configured for Google OAuth only
export const inAppGoogleWallet = inAppWallet({
  auth: {
    options: ["google"],
  },
});

export const defaultChain = baseSepolia;

