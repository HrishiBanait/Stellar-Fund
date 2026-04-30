"use client";

import { useState, useEffect, useCallback } from "react";
import { WalletType, CONTRACT_ID, EXPLORER_URL } from "@/lib/constants";
import { getBalance } from "@/lib/wallet";
import { Campaign, getCampaignCount, getCampaign } from "@/lib/contract";
import CampaignCard from "@/components/campaign";
import CreateCampaign from "@/components/makeCampaign";
import { ContractEvent, startEventPolling } from "@/lib/contract";
import { createPortal } from "react-dom";
import { WALLET_INFO } from "@/lib/constants";
import { connectWallet, fundWithFriendbot } from "@/lib/wallet";
import { WalletNotFoundError, TransactionRejectedError } from "@/lib/errors";
import { toast } from "sonner";
import {
  Activity,
  Rocket,
  Globe,
  Shield,
  Zap,
  RefreshCw,
  ExternalLink,
  Github,
  Wallet,
  LogOut,
  Copy,
  Coins,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

/* ─────────────────────────────────────────────
   DESIGN SYSTEM  (injected once into <head>)
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

    :root {
      --bg:        #0d0c0a;
      --surface:   #161410;
      --surface2:  #1e1b16;
      --border:    rgba(255,220,130,0.1);
      --border2:   rgba(255,220,130,0.06);
      --gold:      #f0b429;
      --gold-dim:  #b8882a;
      --gold-glow: rgba(240,180,41,0.18);
      --text:      #f5efe6;
      --muted:     #8a7f70;
      --dim:       #4a4338;
      --red:       #e85d4a;
      --green:     #4ec98d;
      --font-display: 'Playfair Display', Georgia, serif;
      --font-body:    'DM Sans', sans-serif;
      --font-mono:    'DM Mono', monospace;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-body);
      font-weight: 400;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* Noise grain overlay */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 1000;
      pointer-events: none;
      opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--dim); border-radius: 2px; }

    /* ── Components ── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
    }
    .card-inner {
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: 2px;
    }

    .btn-gold {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      background: var(--gold);
      color: #0d0c0a;
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.02em;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
    }
    .btn-gold:hover { background: #e6a820; transform: translateY(-1px); }
    .btn-gold:active { transform: translateY(0); }
    .btn-gold:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: transparent;
      color: var(--muted);
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 500;
      border: 1px solid var(--border);
      border-radius: 2px;
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s, background 0.2s;
    }
    .btn-ghost:hover {
      color: var(--gold);
      border-color: var(--gold-dim);
      background: var(--gold-glow);
    }
    .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      background: transparent;
      border: 1px solid var(--border2);
      border-radius: 2px;
      color: var(--muted);
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s, background 0.2s;
    }
    .btn-icon:hover {
      color: var(--gold);
      border-color: var(--gold-dim);
      background: var(--gold-glow);
    }
    .btn-icon.danger:hover {
      color: var(--red);
      border-color: rgba(232,93,74,0.35);
      background: rgba(232,93,74,0.08);
    }

    .display-text {
      font-family: var(--font-display);
      font-weight: 900;
      line-height: 1.05;
      letter-spacing: -0.02em;
    }
    .gold-accent { color: var(--gold); }
    .mono { font-family: var(--font-mono); font-size: 12px; }

    /* Animated underline decoration */
    .section-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--gold-dim);
    }

    /* Divider */
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, var(--border), transparent);
      margin: 0;
    }

    /* Pulse dot */
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .live-dot {
      position: relative;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      flex-shrink: 0;
    }
    .live-dot::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: var(--green);
      animation: pulse-ring 1.6s ease-out infinite;
    }

    /* Fade-in page load */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp 0.55s ease both; }
    .fade-up-1 { animation-delay: 0.05s; }
    .fade-up-2 { animation-delay: 0.12s; }
    .fade-up-3 { animation-delay: 0.20s; }
    .fade-up-4 { animation-delay: 0.30s; }

    /* Spinner */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; }

    /* Modal overlay */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0,0,0,0.72);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    /* Hero ticker stripe */
    @keyframes ticker {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    .ticker-wrap { overflow: hidden; border-top: 1px solid var(--border2); border-bottom: 1px solid var(--border2); }
    .ticker-track {
      display: flex;
      gap: 48px;
      width: max-content;
      animation: ticker 22s linear infinite;
      padding: 10px 0;
    }
    .ticker-item {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--dim);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ticker-item span { color: var(--gold-dim); }

    /* Event row hover */
    .event-row { transition: background 0.15s; }
    .event-row:hover { background: rgba(255,220,130,0.04); }

    /* Feature pill */
    .feature-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-left: 2px solid var(--gold-dim);
      background: var(--surface2);
    }

    /* Progress bar */
    .progress-track {
      height: 3px;
      background: var(--surface2);
      border-radius: 0;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(to right, var(--gold-dim), var(--gold));
      border-radius: 0;
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   WALLET CONNECT COMPONENT
───────────────────────────────────────────── */
interface WalletConnectProps {
  address: string | null;
  walletType: WalletType | null;
  balance: string;
  onConnect: (address: string, walletType: WalletType) => void;
  onDisconnect: () => void;
  onBalanceUpdate: (balance: string) => void;
}

function WalletConnect({ address, walletType, balance, onConnect, onDisconnect, onBalanceUpdate }: WalletConnectProps) {
  const [showModal, setShowModal] = useState(false);
  const [modalKey, setModalKey]   = useState(0);
  const [connecting, setConnecting] = useState<WalletType | null>(null);
  const [funding, setFunding]     = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const openModal  = () => { setModalKey(k => k + 1); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleConnect = async (type: WalletType) => {
    setConnecting(type);
    try {
      const connection = await connectWallet(type);
      const bal = await getBalance(connection.address);
      onConnect(connection.address, type);
      onBalanceUpdate(bal);
      setShowModal(false);
      toast.success(`Connected — ${WALLET_INFO[type].name}`, {
        description: `${connection.address.slice(0, 8)}…${connection.address.slice(-8)}`,
      });
    } catch (error) {
      if (error instanceof WalletNotFoundError) {
        toast.error("Wallet not found", {
          description: error.message,
          action: { label: "Install", onClick: () => window.open(WALLET_INFO[type].url, "_blank") },
        });
      } else if (error instanceof TransactionRejectedError) {
        toast.error("Connection rejected");
      } else {
        toast.error("Connection failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleFund = async () => {
    if (!address) return;
    setFunding(true);
    try {
      const success = await fundWithFriendbot(address);
      if (success) {
        const bal = await getBalance(address);
        onBalanceUpdate(bal);
        toast.success("Account funded", { description: "10,000 XLM added to testnet account." });
      } else {
        toast.error("Funding failed", { description: "Account may already be funded." });
      }
    } catch {
      toast.error("Funding error");
    } finally {
      setFunding(false);
    }
  };

  const copyAddress = () => {
    if (address) { navigator.clipboard.writeText(address); toast.success("Address copied"); }
  };

  /* ── Connected state ── */
  if (address && walletType) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Balance chip */}
        <div style={{
          padding: "6px 14px",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 2,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div className="live-dot" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--gold)" }}>
            {parseFloat(balance).toFixed(2)} XLM
          </span>
        </div>

        {/* Address chip */}
        <div style={{
          padding: "6px 12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 2,
          display: "flex", alignItems: "center", gap: 10,
        }}>
        
          <span className="mono" style={{ color: "var(--muted)" }}>
            {address.slice(0, 6)}…{address.slice(-6)}
          </span>

          <button className="btn-icon" onClick={copyAddress} title="Copy address" style={{ width: 28, height: 28 }}>
            <Copy size={13} />
          </button>
          <button className="btn-icon" onClick={() => window.open(`https://stellar.expert/explorer/testnet/account/${address}`, "_blank")} title="Explorer" style={{ width: 28, height: 28 }}>
            <ExternalLink size={13} />
          </button>
          <button className="btn-icon" onClick={handleFund} disabled={funding} title="Fund via Friendbot" style={{ width: 28, height: 28 }}>
            {funding ? <Loader2 size={13} className="spin" /> : <Coins size={13} />}
          </button>
          <button className="btn-icon danger" onClick={onDisconnect} title="Disconnect" style={{ width: 28, height: 28 }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Disconnected state ── */
  return (
    <>
      <button className="btn-gold" onClick={openModal}>
        <Wallet size={15} />
        Connect Wallet
      </button>

      {mounted && showModal && createPortal(
        <div key={modalKey} className="modal-overlay" onClick={closeModal}>
          <div className="card" style={{ width: "100%", maxWidth: 420, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p className="section-label" style={{ marginBottom: 6 }}>Stellar Testnet</p>
                  <h2 className="display-text" style={{ fontSize: 26 }}>Connect Wallet</h2>
                </div>
                <button className="btn-icon" onClick={closeModal}>
                  <XCircle size={16} />
                </button>
              </div>
            </div>

            {/* Wallet options */}
            <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(WALLET_INFO).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => handleConnect(type as WalletType)}
                  disabled={connecting !== null}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "var(--surface2)",
                    border: "1px solid var(--border2)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: connecting ? "not-allowed" : "pointer",
                    opacity: connecting && connecting !== type ? 0.45 : 1,
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-dim)";
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--gold-glow)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border2)";
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--surface2)";
                  }}
                >
                  <span style={{ fontSize: 22 }}></span>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)" }}>{info.name}</p>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>Click to connect</p>
                  </div>
                  {connecting === type
                    ? <Loader2 size={16} className="spin" style={{ color: "var(--gold)" }} />
                    : <ArrowRight size={14} style={{ color: "var(--dim)" }} />
                  }
                </button>
              ))}
            </div>

            <div style={{ padding: "0 28px 20px" }}>
              <p style={{ fontSize: 11, color: "var(--dim)", textAlign: "center" }}>
                Ensure the wallet browser extension is installed before connecting.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   LIVE EVENT FEED
───────────────────────────────────────────── */
function EventFeed() {
  const [events, setEvents]     = useState<ContractEvent[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    setIsPolling(true);
    const stop = startEventPolling((newEvents) => {
      setEvents(prev => [...newEvents, ...prev].slice(0, 50));
    }, 6000);
    return () => { stop(); setIsPolling(false); };
  }, []);

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--border2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Activity size={14} style={{ color: "var(--gold)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.01em" }}>Live Events</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isPolling && <div className="live-dot" />}
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{isPolling ? "Listening" : "Paused"}</span>
        </div>
      </div>

      {/* Events list */}
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {events.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <Zap size={28} style={{ color: "var(--dim)", margin: "0 auto 10px", display: "block" }} />
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Awaiting contract events…</p>
            <p style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>Events appear here in real-time</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div
              key={`${event.ledger}-${i}`}
              className="event-row"
              style={{ padding: "12px 20px", borderBottom: "1px solid var(--border2)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", fontFamily: "var(--font-body)" }}>
                  {event.type}
                </span>
                <span className="mono" style={{ color: "var(--dim)" }}>#{event.ledger}</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {JSON.stringify(event.data, (_, v) => typeof v === "bigint" ? v.toString() : v)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TICKER STRIP
───────────────────────────────────────────── */
function TickerStrip() {
  const items = [
    { label: "Multi-Wallet Support", value: "Freighter" },
    { label: "Smart Contracts", value: "Soroban Protocol" },
    { label: "Network", value: "Stellar Testnet" },
    { label: "Real-time Events", value: "Live Ledger Tracking" },
    { label: "Orange Belt", value: "Submission 2024" },
  ];
  const doubled = [...items, ...items];

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <div className="ticker-item" key={i}>
            <span>✦</span>
            {item.label}
            <span>— {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: "20px 24px" }}>
      <p className="section-label" style={{ marginBottom: 8 }}>{label}</p>
      <p className="display-text gold-accent" style={{ fontSize: 32 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType]       = useState<WalletType | null>(null);
  const [balance, setBalance]             = useState("0");
  const [campaigns, setCampaigns]         = useState<Campaign[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const count = await getCampaignCount();
      const loaded: Campaign[] = [];
      for (let i = 0; i < count; i++) {
        const campaign = await getCampaign(i);
        if (campaign) loaded.push(campaign);
      }
      setCampaigns(loaded);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    await fetchCampaigns();
    setLoading(false);
  }, [fetchCampaigns]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const count = await getCampaignCount();
        const loaded: Campaign[] = [];
        for (let i = 0; i < count; i++) {
          const campaign = await getCampaign(i);
          if (campaign) loaded.push(campaign);
        }
        setCampaigns(loaded);
      } catch { /* silent */ }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async (delayMs = 0) => {
    setRefreshing(true);
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
    await fetchCampaigns();
    if (walletAddress) { const bal = await getBalance(walletAddress); setBalance(bal); }
    setRefreshing(false);
  };

  const handleRefreshClick    = () => handleRefresh(0);
  const handleDonationComplete = async () => {
    await new Promise(r => setTimeout(r, 8000));
    await fetchCampaigns();
    if (walletAddress) { const bal = await getBalance(walletAddress); setBalance(bal); }
    setRefreshing(false);
  };

  const handleConnect    = (address: string, type: WalletType) => { setWalletAddress(address); setWalletType(type); };
  const handleDisconnect = () => { setWalletAddress(null); setWalletType(null); setBalance("0"); };

  /* ── Background blobs ── */
  const BgBlobs = () => (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position: "absolute",
        top: "-10%", left: "15%",
        width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(240,180,41,0.06) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%", right: "5%",
        width: 480, height: 480,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(78,201,141,0.04) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
    </div>
  );

  return (
    <>
      <GlobalStyles />
      <BgBlobs />

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        borderBottom: "1px solid var(--border2)",
        background: "rgba(13,12,10,0.85)",
        backdropFilter: "blur(16px)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 36, height: 36,
              background: "var(--gold)",
              borderRadius: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Rocket size={18} color="#0d0c0a" />
            </div>
            <div>
              <h1 className="display-text" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>
                Stellar<span className="gold-accent">Fund</span>
              </h1>
              <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1 }}>
                Testnet · Soroban
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="btn-icon"
              onClick={handleRefreshClick}
              disabled={refreshing}
              title="Refresh campaigns"
            >
              <RefreshCw size={14} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            </button>

            <WalletConnect
              address={walletAddress}
              walletType={walletType}
              balance={balance}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onBalanceUpdate={setBalance}
            />
          </div>
        </div>
      </header>

      {/* ── TICKER ── */}
      <TickerStrip />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── HERO (unauthenticated) ── */}
        {!walletAddress && (
          <section className="fade-up" style={{ marginBottom: 64 }}>
            {/* Top label */}
            <p className="section-label fade-up fade-up-1" style={{ marginBottom: 20 }}>
              ✦ Decentralised Crowdfunding on Blockchain
            </p>

            {/* Headline */}
            <div style={{ maxWidth: 780, marginBottom: 40 }}>
              <h2 className="display-text fade-up fade-up-2" style={{ fontSize: "clamp(48px, 6vw, 82px)", color: "var(--text)" }}>
                Fund the future,<br />
                <span className="gold-accent">one ledger</span><br />
                at a time.
              </h2>
            </div>

            <p className="fade-up fade-up-3" style={{ fontSize: 16, color: "var(--muted)", maxWidth: 520, lineHeight: 1.7, marginBottom: 36 }}>
              Create campaigns, accept donations, and track every transaction in
              real-time — all secured by Stellar smart contracts and the Soroban VM.
            </p>

            <div className="fade-up fade-up-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 60 }}>
              <WalletConnect
                address={walletAddress}
                walletType={walletType}
                balance={balance}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onBalanceUpdate={setBalance}
              />
              <a
                href={`${EXPLORER_URL}/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                <ExternalLink size={13} />
                View Contract
              </a>
            </div>

            {/* Feature pills */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1 }}>
              {[
                { icon: <Globe size={16} />, label: "Multi-Wallet", sub: "Freighter" },
                { icon: <Shield size={16} />, label: "Smart Contract", sub: "Soroban on Testnet" },
                { icon: <Zap size={16} />, label: "Real-time", sub: "Live event tracking" },
                { icon: <Sparkles size={16} />, label: "Trustless", sub: "No intermediaries" },
              ].map((f, i) => (
                <div className="feature-pill" key={i}>
                  <span style={{ color: "var(--gold)" }}>{f.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</p>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CONTRACT INFO BAR ── */}
        <div className="card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          <div>
            <p className="section-label" style={{ marginBottom: 4 }}>Deployed Contract · Testnet</p>
            <p className="mono" style={{ color: "var(--gold-dim)", wordBreak: "break-all" }}>{CONTRACT_ID}</p>
          </div>
          <a
            href={`${EXPLORER_URL}/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{ flexShrink: 0 }}
          >
            <ExternalLink size={13} />
            Explorer
          </a>
        </div>

        {/* ── STATS ROW (when connected) ── */}
        {walletAddress && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 1, marginBottom: 40 }}>
            <StatCard label="Your Balance" value={`${parseFloat(balance).toFixed(0)} XLM`} sub="Testnet funds" />
            <StatCard label="Active Campaigns" value={String(campaigns.length)} sub="On-chain now" />
            <StatCard label="Network" value="Testnet" sub="Soroban / Stellar" />
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }} className="main-grid">

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Create campaign */}
            {walletAddress && walletType && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <p className="section-label">New Campaign</p>
                  <div className="divider" style={{ flex: 1 }} />
                </div>
                <CreateCampaign
                  walletAddress={walletAddress}
                  walletType={walletType}
                  onCampaignCreated={handleRefreshClick}
                />
              </div>
            )}

            {/* Campaigns list */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <p className="section-label">Active Campaigns</p>
                <div className="divider" style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "var(--dim)" }}>
                  {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <RefreshCw size={24} className="spin" style={{ color: "var(--gold)", margin: "0 auto 12px", display: "block" }} />
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading campaigns…</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="card" style={{ padding: "60px 40px", textAlign: "center" }}>
                  <Rocket size={36} style={{ color: "var(--dim)", margin: "0 auto 16px", display: "block" }} />
                  <h3 className="display-text" style={{ fontSize: 22, marginBottom: 8 }}>No campaigns yet</h3>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>
                    {walletAddress ? "Be the first to launch one." : "Connect your wallet to get started."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {campaigns.map(campaign => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      walletAddress={walletAddress}
                      walletType={walletType}
                      onDonationComplete={handleDonationComplete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Live events */}
            <EventFeed />

            {/* How it works */}
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border2)" }}>
                <p className="section-label">How It Works</p>
              </div>
              <div style={{ padding: "20px" }}>
                {[
                  "Connect your Stellar wallet (Freighter)",
                  "Fund your testnet account using the Friendbot",
                  "Create a campaign or donate to existing ones",
                  "Track transactions and events in real-time",
                ].map((step, i) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: 14,
                    paddingBottom: i < 3 ? 16 : 0,
                    marginBottom: i < 3 ? 16 : 0,
                    borderBottom: i < 3 ? "1px solid var(--border2)" : "none",
                  }}>
                    <span className="display-text gold-accent" style={{ fontSize: 20, lineHeight: 1.3, flexShrink: 0 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Error reference */}
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border2)" }}>
                <p className="section-label">Error Reference</p>
              </div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { color: "var(--red)",    label: "Wallet Not Found",       desc: "Extension missing or not installed" },
                  { color: "#e6a820",       label: "Transaction Rejected",   desc: "User declined in wallet UI" },
                  { color: "var(--muted)",  label: "Insufficient Balance",   desc: "Pre-checked before any transaction" },
                ].map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: e.color, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{e.label}</p>
                      <p style={{ fontSize: 11, color: "var(--muted)" }}>{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border2)", padding: "28px 24px" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 22, height: 22, background: "var(--gold)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Rocket size={11} color="#0d0c0a" />
            </div>
            <span className="display-text" style={{ fontSize: 14 }}>
              Stellar<span className="gold-accent">Fund</span>
            </span>
            <span style={{ fontSize: 11, color: "var(--dim)", marginLeft: 4 }}>Orange Belt Submission</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a
              href={`${EXPLORER_URL}/contract/${CONTRACT_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--gold)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}
            >
              <ExternalLink size={12} /> Explorer
            </a>
            <a
              href="https://github.com/HrishiBanait/Stellar-Fund"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--gold)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}
            >
              <Github size={12} /> GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* Responsive sidebar collapse */}
      <style jsx>{`
        @media (max-width: 900px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}