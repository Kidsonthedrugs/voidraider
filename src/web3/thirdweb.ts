import { createThirdwebClient } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";
import { baseSepolia } from "thirdweb/chains";

// Read Thirdweb Client ID strictly from environment variable
export const THIRDWEB_CLIENT_ID =
  (import.meta.env.VITE_THIRDWEB_CLIENT_ID as string) || "";

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
