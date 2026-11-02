import React, { useState } from 'react';
import { ConnectButton, darkTheme, useActiveAccount, useActiveWallet, useDisconnect, useConnect } from 'thirdweb/react';
import { inAppWallet } from 'thirdweb/wallets';
import { thirdwebClient, defaultChain, inAppGoogleWallet } from '../web3/thirdweb';
import { LogOut, Copy, Check, ShieldCheck, Loader2 } from 'lucide-react';

interface GoogleConnectProps {
  compact?: boolean;
  onAddressChange?: (address: string | null) => void;
  showStatusOnlyIfConnected?: boolean;
}

export const GoogleConnect: React.FC<GoogleConnectProps> = ({
  compact = false,
  showStatusOnlyIfConnected = false,
}) => {
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { connect, isConnecting } = useConnect();

  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const address = activeAccount?.address;
  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = async () => {
    if (activeWallet) {
      disconnect(activeWallet);
    }
    setDropdownOpen(false);
  };

  const handleCustomGoogleLogin = async () => {
    try {
      setLoginError(null);
      const wallet = inAppWallet({
        auth: {
          options: ['google'],
        },
      });
      await connect(async () => {
        await wallet.connect({
          client: thirdwebClient,
          strategy: 'google',
          chain: defaultChain,
        });
        return wallet;
      });
    } catch (err: unknown) {
      console.error('Google login error:', err);
      setLoginError(err instanceof Error ? err.message : 'Google authentication failed');
    }
  };

  if (address) {
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs font-mono text-cyan-300 hover:bg-slate-800/90 transition-all shadow-sm cursor-pointer"
        >
          {/* Google Color Indicator / Pilot Dot */}
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">{truncatedAddress}</span>
          <span className="text-[10px] text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
            Google
          </span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0b101b] border border-slate-800 shadow-2xl p-3 z-50 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-[10px] font-mono text-slate-400">IN-APP WALLET</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3 h-3" /> Active
              </span>
            </div>

            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 mb-3">
              <div className="text-[10px] text-slate-500 font-mono mb-0.5">ADDRESS</div>
              <div className="font-mono text-xs text-white break-all flex items-center justify-between gap-2">
                <span className="truncate">{address}</span>
                <button
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                  title="Copy address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-rose-400 hover:bg-rose-950/30 border border-rose-900/40 transition-colors cursor-pointer font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect In-App Wallet</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (showStatusOnlyIfConnected) {
    return null;
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleCustomGoogleLogin}
        disabled={isConnecting}
        className={`flex items-center justify-center gap-2.5 rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer ${
          compact ? 'px-3 py-1.5' : 'px-4 py-2'
        } bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`}
        title="Sign in with Google to create an in-app wallet"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            {/* Google Multi-Color SVG Logo */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="tracking-tight">Connect with Google</span>
          </>
        )}
      </button>

      {loginError && (
        <span className="text-[10px] text-rose-400 font-mono max-w-[200px] truncate" title={loginError}>
          {loginError}
        </span>
      )}
    </div>
  );
};

