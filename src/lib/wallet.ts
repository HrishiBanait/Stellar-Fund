"use client";

import {
  requestAccess,
  getPublicKey,
  isConnected,
  signTransaction as freighterSignTx,
} from "@stellar/freighter-api";
import {
  WalletNotFoundError,
  TransactionRejectedError,
  InsufficientBalanceError,
  classifyError,
} from "./errors";
import { WalletType, NETWORK, SOROBAN_RPC_URL, HORIZON_URL } from "./constants";

export interface WalletConnection {
  address: string;
  walletType: WalletType;
}

// Stellar public keys start with G and are 56 chars
function isStellarPublicKey(s: string): boolean {
  return typeof s === "string" && s.startsWith("G") && s.length === 56;
}

// Connect to Freighter wallet
async function connectFreighter(): Promise<string> {
  try {
    // requestAccess() returns a plain string: either the public key OR an error message
    const accessResult = await requestAccess();

    if (isStellarPublicKey(accessResult)) {
      return accessResult;
    }

    // accessResult is an error message string — try getPublicKey as fallback
    const pkResult = await getPublicKey();
    if (isStellarPublicKey(pkResult)) {
      return pkResult;
    }

    // Both failed — show the actual error from Freighter
    const errMsg = accessResult || pkResult || "Could not connect to Freighter";
    if (
      errMsg.toLowerCase().includes("declined") ||
      errMsg.toLowerCase().includes("rejected") ||
      errMsg.toLowerCase().includes("denied")
    ) {
      throw new TransactionRejectedError();
    }
    throw new Error(errMsg);
  } catch (error: any) {
    if (error instanceof TransactionRejectedError) throw error;
    if (error instanceof WalletNotFoundError) throw error;
    const msg: string = error?.message ?? String(error) ?? "";
    if (
      msg.includes("declined") ||
      msg.includes("rejected") ||
      msg.includes("denied")
    ) {
      throw new TransactionRejectedError();
    }
    throw new Error(msg || "Failed to connect Freighter wallet");
  }
}


// Main connect function
export async function connectWallet(
  walletType: WalletType
): Promise<WalletConnection> {
  let address: string;

  switch (walletType) {
    case WalletType.FREIGHTER:
      address = await connectFreighter();
      break;

    default:
      throw new Error(`Unsupported wallet type: ${walletType}`);
  }

  return { address, walletType };
}

// Get account balance
export async function getBalance(address: string): Promise<string> {
  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${address}`);
    if (!response.ok) {
      if (response.status === 404) {
        return "0";
      }
      throw new Error("Failed to fetch account");
    }
    const data = await response.json();
    const nativeBalance = data.balances.find(
      (b: any) => b.asset_type === "native"
    );
    return nativeBalance ? nativeBalance.balance : "0";
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
}

// Fund account with friendbot (testnet only)
export async function fundWithFriendbot(address: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

// Sign transaction with connected wallet
export async function signTransaction(
  xdr: string,
  walletType: WalletType,
  networkPassphrase: string
): Promise<string> {
  switch (walletType) {
    case WalletType.FREIGHTER: {
      try {
        const result = await freighterSignTx(xdr, {
          network: "TESTNET",
          networkPassphrase,
        });
        // freighter-api v2: returns plain string (signed XDR) or error string
        const signedXdr = typeof result === "string"
          ? result
          : (result as any)?.signedTransaction ?? (result as any)?.signed_envelope_xdr ?? "";
        if (!signedXdr) {
          throw new Error("Freighter did not return a signed transaction");
        }
        // Valid Stellar XDR is base64-encoded and always >200 chars
        // If Freighter returned an error string instead of XDR, handle it
        if (signedXdr.length < 200) {
          const msg = signedXdr.toLowerCase();
          if (msg.includes("declined") || msg.includes("rejected") || msg.includes("denied") || msg.includes("cancel")) {
            throw new TransactionRejectedError();
          }
          throw new Error(signedXdr || "Freighter did not sign the transaction");
        }
        return signedXdr;
      } catch (error: any) {
        if (error instanceof TransactionRejectedError) throw error;
        if (
          error?.message?.includes("User declined") ||
          error?.message?.includes("rejected") ||
          error?.message?.includes("denied")
        ) {
          throw new TransactionRejectedError();
        }
        throw new Error(error?.message ?? "Freighter signing failed");
      }
    }
    
    default:
      throw new Error("Unsupported wallet");
  }
}

// Validate balance before transaction
export async function validateBalance(
  address: string,
  requiredAmount: string
): Promise<void> {
  const balance = await getBalance(address);
  const available = parseFloat(balance);
  const required = parseFloat(requiredAmount);

  if (available < required) {
    throw new InsufficientBalanceError(
      required.toFixed(2),
      available.toFixed(2)
    );
  }
}
