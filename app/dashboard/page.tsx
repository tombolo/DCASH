"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaCheckCircle, FaTimes } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa6";
import { IoIosArrowRoundBack } from "react-icons/io";
import ReactCountryFlag from "react-country-flag";

// Configuration based on user email
const USER_CONFIGS = {
  "dannymwas652@gmail.com": {
    appId: "68794",
    apiToken: "24wSSNcbPnVMvKp"
  },
  "kinylawrence@gmail.com": {
    appId: "111436",  // Replace with actual second app ID
    apiToken: "GcxS6F05Rb3nb2t"  // Replace with actual second API token
  },
  "legoobrian4@gmail.com": {
    appId: "99617",  // Replace with actual second app ID
    apiToken: "ZylaX5sbyafG0R0"  // Replace with actual second API token
  },
  "finestburu1@gmail.com": {
    appId: "110106",
    apiToken: "uDuENh9Y7I999dq"
  },
  "finesttraders1@gmail.com": {
    appId: "110113",
    apiToken: "U5ibpwIxlJMZOM5"
  },
  "collinsomae079@gmail.com": {
    appId: "112504",
    apiToken: "dxZq4k7hFIebDHG"
  },
  "johnmulideriv@gmail.com": {
    appId: "112060",
    apiToken: "S2wZWPbJpbYlxYR"
  },
  "mainacharles03ndungu@gmail.com": {
    appId: "71128",
    apiToken: "Z7EYdrJFnzxIz7R"
  },
  "josephmumo445@gmail.com": {
    appId: "101644",
    apiToken: "Kfwc0MtpQPSMvC1"
  }



} as const;

// Helper to get user config
const getUserConfig = (email: string) => {
  return USER_CONFIGS[email as keyof typeof USER_CONFIGS] || USER_CONFIGS["dannymwas652@gmail.com"];
};

interface Transaction {
  type: "Deposit" | "Withdraw";
  amount: string;
  date: string;
  id: string;
  flag: string;
  amountNumber: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWithdrawPage, setShowWithdrawPage] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  // Initialize transactions with empty array or from localStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deriv-transactions');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [derivAccountName, setDerivAccountName] = useState<string>("");
  const [userFullName, setUserFullName] = useState<string>("");

  const handleResendCode = async () => {
    try {
      // Reset any existing error
      setVerificationError("");

      // Here you would typically make an API call to resend the verification code
      // For example:
      // await resendVerificationCode(user.email);

      // Start countdown (60 seconds)
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Show success message
      setIsCodeSent(true);
      setTimeout(() => setIsCodeSent(false), 3000);
    } catch (error) {
      console.error("Error resending code:", error);
      setVerificationError("Failed to resend verification code. Please try again.");
    }
  };

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const EXCHANGE_RATE = 124.03; // 1 USD = 124.03 KES (update if rate changes)

  // Format balance with commas for thousands
  const formatBalance = (balance: number | null): string => {
    if (balance === null) return "0.00";
    return balance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Generate transaction ID
  const generateTransactionId = (type?: "Deposit" | "Withdraw"): string => {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const prefix = type ? (type === "Deposit" ? "T" : "T") : "T";
    return `${prefix}${random}`;
  };

  // Format date for transaction as 'DD MMM YYYY, HH:mm'
  const getCurrentDate = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('default', { month: 'short' });
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  // Load transactions from localStorage (kept for backward compatibility)
  const loadTransactions = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deriv-transactions');
      if (saved) {
        setTransactions(JSON.parse(saved));
      }
    }
  };

  // Save transactions to localStorage
  const saveTransactions = (newTransactions: Transaction[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('deriv-transactions', JSON.stringify(newTransactions));
    }
  };

  // Add new transaction
  const addTransaction = (type: "Deposit" | "Withdraw", amount: number) => {
    const newTransaction: Transaction = {
      type,
      amount: formatBalance(amount),
      date: getCurrentDate(),
      id: generateTransactionId(type),
      flag: type === "Withdraw" ? "KE" : "US",
      amountNumber: amount
    };

    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
  };

  // Process withdrawal - update balance and add transaction
  const processWithdrawal = (withdrawAmount: number) => {
    if (balance !== null && withdrawAmount <= balance) {
      // Update balance
      const newBalance = balance - withdrawAmount;
      setBalance(newBalance);

      // Add transaction
      addTransaction("Withdraw", withdrawAmount);

      return true;
    }
    return false;
  };

  const amountNumber = amount === "" ? 0 : Number(amount);

  useEffect(() => {
    // Load transactions when component mounts
    loadTransactions();

    const fetchUserData = async (uid: string) => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          setUserFullName(userDoc.data().name || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        setShowPremiumBanner(user.email !== "dannymwas652@gmail.com");
        fetchUserData(user.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // Countdown timer for resend code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSignOut = async () => {
    try {
      if (wsRef.current) {
        wsRef.current.close(1000, "User signed out");
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // WebSocket connection - get account info and balance
  useEffect(() => {
    if (!user || !user.email) return;

    // Get the appropriate config based on user email
    const userConfig = getUserConfig(user.email);
    const APP_ID = userConfig.appId;
    const API_TOKEN = userConfig.apiToken;

    console.log(`Connecting WebSocket for email: ${user.email}, App ID: ${APP_ID}`);

    const connectWebSocket = () => {
      const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected for ${user.email} with App ID: ${APP_ID}`);
        setBalanceError(null);
        ws.send(JSON.stringify({ authorize: API_TOKEN }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.msg_type === "authorize") {
          if (data.error) {
            setBalanceError(`Auth failed: ${data.error.message}`);
            setBalanceLoading(false);
            return;
          }

          // Set Deriv account name from authorize response
          if (data.authorize && data.authorize.loginid) {
            setDerivAccountName(data.authorize.loginid);
          }

          // Get account information
          ws.send(JSON.stringify({
            get_account_status: 1
          }));

          // Subscribe to balance
          ws.send(JSON.stringify({
            balance: 1,
            account: "current",
            subscribe: 1,
            req_id: Date.now()
          }));
        }

        if (data.msg_type === "balance") {
          setBalanceLoading(false);
          if (data.error) {
            setBalanceError(`Balance error: ${data.error.message}`);
            setBalance(0);
            return;
          }
          if (data.balance) {
            if (typeof data.balance === 'number') {
              setBalance(data.balance);
            } else if (data.balance.balance) {
              setBalance(data.balance.balance);
            } else {
              const balanceValue = Object.values(data.balance)[0] as any;
              setBalance(balanceValue?.balance || balanceValue || 0);
            }
            setBalanceError(null);
          }
        }

        if (data.msg_type === "balance.update" && data.balance) {
          if (typeof data.balance === 'number') {
            setBalance(data.balance);
          } else if (data.balance.balance) {
            setBalance(data.balance.balance);
          }
        }

        // Handle account status response
        if (data.msg_type === "get_account_status") {
          if (data.get_account_status && data.get_account_status.loginid) {
            setDerivAccountName(data.get_account_status.loginid);
          }
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${user.email}:`, error);
        setBalanceError("WebSocket connection error");
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed for ${user.email}:`, event.code, event.reason);
        setBalanceLoading(true);
        if (event.code !== 1000) {
          setTimeout(() => connectWebSocket(), 5000);
        }
      };

      return ws;
    };

    const startPing = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ ping: 1 }));
        }
      }, 30000);
    };

    const ws = connectWebSocket();
    startPing();

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [user]); // Add user as dependency to reconnect when user changes

  const handleKeypadPress = (key: string) => {
    setAmount(prev => {
      // DELETE (Backspace)
      if (key === "⌫") {
        return prev.slice(0, -1);
      }

      // DECIMAL POINT
      if (key === ".") {
        if (prev === "") return "0.";   // FIX: Prevent invalid "."
        if (prev.includes(".")) return prev; // Prevent duplicates
        return prev + ".";
      }

      // NUMBERS
      return prev + key;
    });
  };

  const keypadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  // Handle verification code input
  const handleVerificationCodeChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setVerificationError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newCode.every(digit => digit !== "") && index === 5) {
      handleVerifyCode();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle full 6-digit code input from single input box
  const handleFullCodeInput = (value: string) => {
    // Only allow digits and max 6 characters
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    const newCode = sanitized.split('');

    // Pad with empty strings if needed
    while (newCode.length < 6) {
      newCode.push('');
    }

    setVerificationCode(newCode);
    setVerificationError("");

    // Auto-submit when all 6 digits are entered
    if (sanitized.length === 6) {
      handleVerifyCode();
    }
  };

  // Generate a random 6-digit code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Store the generated code in a ref to persist between renders
  const verificationCodeRef = useRef<string>('');

  // Send verification code via email using Resend
  const sendVerificationCode = async () => {
    console.log('Sending verification code...');

    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      setVerificationError("User not authenticated");
      return false;
    }

    setIsCodeSent(true);
    setCountdown(60); // 60 seconds countdown
    setVerificationError("");

    try {
      // Generate and store a new verification code
      const code = generateVerificationCode();
      verificationCodeRef.current = code;

      console.log('Generated verification code:', code);

      // Send email with the verification code using your API route
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentUser.email,
          name: derivAccountName || currentUser.displayName || 'User',
          code: code
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send verification code');
      }

      console.log(`Verification code sent to ${currentUser.email}`);
      return true;
    } catch (error) {
      console.error("Error sending verification code:", error);
      setVerificationError(error instanceof Error ? error.message : "Failed to send verification code. Please try again.");
      setIsCodeSent(false);
      return false;
    }
  };

  // Handle withdraw initiation
  const handleWithdraw = async () => {
    console.log('Withdraw button clicked');

    // Reset any previous errors
    setVerificationError('');

    // Validate amount
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setVerificationError("Please enter a valid amount");
      return;
    }

    // Check balance
    if (balance !== null && amountValue > balance) {
      setVerificationError("Insufficient balance");
      return;
    }

    try {
      // Show the email verification modal
      setShowEmailVerification(true);

      // Send the verification code
      await sendVerificationCode();
      console.log('Verification code sent');
    } catch (error) {
      console.error('Withdrawal error:', error);
      setVerificationError("Failed to initiate withdrawal. Please try again.");
    }
  };

  // Verify the code
  const handleVerifyCode = async () => {
    if (verificationCode.some(digit => digit === "")) {
      setVerificationError("Please enter the complete code");
      return;
    }

    const enteredCode = verificationCode.join("");

    // Compare with the generated code
    if (enteredCode === verificationCodeRef.current) {
      const withdrawAmount = parseFloat(amount);

      // Process the withdrawal - update balance and add transaction
      const success = processWithdrawal(withdrawAmount);

      if (success) {
        setWithdrawSuccess(true);

        // Reset everything after successful verification
        setTimeout(() => {
          setShowEmailVerification(false);
          setShowWithdrawPage(false);
          setShowWithdrawModal(false);
          setAmount("");
          setVerificationCode(["", "", "", "", "", ""]);
          setWithdrawSuccess(false);
          setIsCodeSent(false);
        }, 3000);
      } else {
        setVerificationError("Failed to process withdrawal");
      }
    } else {
      setVerificationError("Invalid verification code");
    }

    setIsVerifying(false);
  };

  // Resend verification code
  useEffect(() => {
    const allowedEmails = [
      "dannymwas652@gmail.com",
      "kinylawrence@gmail.com",
      "finestburu1@gmail.com",
      "finesttraders1@gmail.com",
      "johnmulideriv@gmail.com",
      "ndanumumo93@gmail.com",
      "collinsomae079@gmail.com",
      "josephmumo445@gmail.com",
      "mainacharles03ndungu@gmail.com"
    ];

    if (!user || !allowedEmails.includes(user.email)) {
      setShowPremiumBanner(true);
    } else {
      setShowPremiumBanner(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white px-4 py-6 flex flex-col items-center font-sans overflow-hidden">
      {/* Illegal Use Banner */}
      {showPremiumBanner && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-3 z-50">
          <p className="font-semibold text-sm md:text-base">
            Illegal use, please contact tombolo
          </p>
        </div>
      )}

      {/* Header */}
      <div className={`w-full max-w-md flex justify-between items-center mb-6 ${showPremiumBanner ? 'mt-12' : ''}`}>
        <div>
          <p className="text-sm text-gray-500">Welcome Back,</p>
          <h1 className="text-2xl font-bold text-gray-800"> {userFullName || user?.email?.split('@')[0]}</h1>
        </div>
        <div className="relative group">
          <button
            className="text-black hover:text-black text-2xl ml-2"
            onClick={() => document.querySelector('.profile-dropdown')?.classList.toggle('hidden')}
          >
            <FaRegUser />
          </button>
          <div className="profile-dropdown absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg py-1 z-10 hidden">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="w-full max-w-md bg-[#661DFF] text-white rounded-xl p-5 shadow-md mb-4">
        <div>
          <p className="text-sm opacity-80">Deriv Balance</p>
          <p className="text-2xl font-semibold mt-1">
            {balanceLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Loading...
              </div>
            ) : balanceError ? (
              <span className="text-sm">Connection Error</span>
            ) : (
              `${formatBalance(balance)} USD`
            )}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full max-w-md flex gap-4 mb-6">
        <button className="flex-1 bg-[#661DFF] text-white py-3 rounded-lg font-semibold shadow-md">
          Deposit
        </button>
        <button
          className="flex-1 bg-white border border-gray-200 text-[#661DFF] py-3 rounded-lg font-semibold shadow-md"
          onClick={() => {
            setShowWithdrawPage(true);
            setShowWithdrawModal(true);
          }}
        >
          Withdraw
        </button>
      </div>

      {/* Transactions */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4 z-10">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold text-gray-700">Transactions</p>
          <button className="text-[#661DFF] text-sm font-medium">View all</button>
        </div>
        <div className="divide-y">
          {transactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <div key={i} className="flex justify-between items-center py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
                      <ReactCountryFlag
                        countryCode={tx.flag}
                        svg
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      />
                    </div>
                    {tx.type}
                  </p>
                  <p className="text-xs text-gray-500">{tx.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {tx.amount}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">{tx.date}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdraw Page */}
      {showWithdrawPage && (
        <div className="absolute inset-0 bg-white z-30 flex flex-col p-5 h-full transition-all duration-300">
          <div className="flex items-center mb-4 relative">
            <button
              className="absolute left-0 text-3xl text-gray-700"
              onClick={() => {
                setShowWithdrawPage(false);
                setShowWithdrawModal(false);
                setAmount("");
              }}
            >
              <IoIosArrowRoundBack />
            </button>
            <h2 className="text-xl font-semibold mb-2">Withdraw</h2>
          </div>

          <p className="text-center text-sm text-gray-500 mb-2">From</p>
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button className="px-4 py-1 bg-[#5B21B6] text-white rounded-md text-sm font-medium">
                Deriv
              </button>
              <button className="px-4 py-1 text-gray-500 text-sm font-medium">MT5</button>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-4xl font-semibold text-gray-800">
              {/* Top shows KES converted from the USD amount */}
              {amount && !isNaN(parseFloat(amount))
                ? formatBalance(parseFloat(amount) * EXCHANGE_RATE)
                : "0.00"} KES
            </p>
            <p className="text-sm text-gray-500">1 USD = {EXCHANGE_RATE.toFixed(2)} KES</p>
          </div>

          <div className="border-t border-gray-300 my-3" />
          <div className="flex justify-center items-center gap-1 mb-1">
            <span className="text-sm text-gray-500">USD</span>
            <span className="text-lg text-gray-800 font-medium">
              {/* Line shows the raw USD value typed (formatted) */}
              {amount && !isNaN(parseFloat(amount))
                ? formatBalance(parseFloat(amount))
                : "0.00"}
            </span>
          </div>
          <p className="text-sm text-gray-500 text-center mb-4">
            Available balance is {formatBalance(balance)} USD
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6 flex-1">
            {keypadKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleKeypadPress(key)}
                className="bg-gray-100 rounded-2xl py-3 text-lg font-semibold text-gray-800 active:bg-gray-200"
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={handleWithdraw}
            disabled={!amount || parseFloat(amount) <= 0}
            className={`w-full py-3 rounded-lg font-semibold shadow-md mt-auto ${!amount || parseFloat(amount) <= 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#5B21B6] text-white hover:bg-[#4c1d95]"
              }`}
          >
            Withdraw
          </button>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white w-11/12 max-w-sm rounded-2xl p-6 text-center shadow-xl border border-gray-100">
            <h2 className="text-lg font-semibold mb-2">Choose Account</h2>
            <p className="text-sm text-gray-500 mb-4">
              You can set your default withdraw account in the account settings page.
            </p>

            <div
              onClick={() => setSelectedAccount("mpesa")}
              className={`flex justify-between items-center border p-3 rounded-lg cursor-pointer ${selectedAccount === "mpesa" ? "border-[#5B21B6]" : "border-gray-200"
                }`}
            >
              <div className="flex flex-col text-left">
                <p className="font-semibold text-gray-700">M-PESA</p>
                <p className="text-sm text-gray-500">254741905066</p>
              </div>
              <input
                type="radio"
                checked={selectedAccount === "mpesa"}
                onChange={() => setSelectedAccount("mpesa")}
              />
            </div>

            <button
              disabled={!selectedAccount}
              onClick={() => setShowWithdrawModal(false)}
              className={`w-full py-3 mt-5 rounded-lg font-semibold ${selectedAccount ? "bg-[#5B21B6] text-white" : "bg-gray-200 text-gray-400"
                }`}
            >
              Proceed
            </button>

            <button
              className="mt-4 text-[#5B21B6] font-medium"
              onClick={() => {
                setShowWithdrawModal(false);
                setShowWithdrawPage(false);
              }}
            >
              Cancel Withdrawal
            </button>
          </div>
        </div>
      )}

      {/* Email Verification Modal */}
      {showEmailVerification && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="w-11/12 max-w-md rounded-2xl bg-white text-center shadow-xl border border-gray-100">
            {withdrawSuccess ? (
              <div className="py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-3xl text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Withdrawal Successful!</h2>
                <p className="text-gray-600 mb-4">
                  Your withdrawal of {formatBalance(parseFloat(amount))} USD has been processed.
                </p>
                <p className="text-sm text-gray-500">
                  Funds will be transferred to your M-PESA account within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white w-full rounded-2xl p-6 shadow-lg">
                  <h2 className="text-2xl font-bold text-black text-center mb-2">
                    Verification
                  </h2>

                  <p className="text-gray-700 text-center text-base">
                    Please enter the verification code sent to
                  </p>

                  <p className="text-black font-semibold text-center text-base mb-6">
                    {user.email}
                  </p>

                  {/* Verification Code Input Box (SINGLE BOX like screenshot) */}
                  <div className="mb-6">
                    <div className="w-full flex items-center bg-gray-100 rounded-xl px-4 py-3 border border-gray-300">
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode.join("")}
                        onChange={(e) => handleFullCodeInput(e.target.value)}
                        className="w-full bg-transparent text-lg tracking-widest font-semibold outline-none"
                        disabled={isVerifying}
                      />
                      <span className="text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 11c.6 0 1-.4 1-1V7a1 1 0 10-2 0v3c0 .6.4 1 1 1zm0 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 5a9 9 0 110-18 9 9 0 010 18z"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {verificationError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-700 text-sm flex items-center justify-center gap-2">
                        <FaTimes />
                        {verificationError}
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleVerifyCode}
                      disabled={isVerifying || verificationCode.some((d) => d === "")}
                      className={`w-full py-3 rounded-xl font-semibold text-base ${isVerifying || verificationCode.some((d) => d === "")
                        ? "bg-[#5B21B6] text-white cursor-not-allowed"
                        : "bg-[#5B21B6] text-white"
                        }`}
                    >
                      {isVerifying ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          Verifying.
                        </div>
                      ) : (
                        "Verify & Withdraw"
                      )}
                    </button>

                    <button
                      onClick={handleResendCode}
                      disabled={countdown > 0}
                      className={`text-sm font-medium text-center ${countdown > 0
                        ? "text-gray-400"
                        : "text-[#5B21B6] hover:text-[#4c1d95]"
                        }`}
                    >
                      {countdown > 0
                        ? `Resend code in ${countdown}s`
                        : "Resend verification code"}
                    </button>

                    <button
                      onClick={() => {
                        setShowEmailVerification(false);
                        setVerificationCode(["", "", "", "", "", ""]);
                        setVerificationError("");
                        setIsCodeSent(false);
                      }}
                      className="text-sm text-[#5B21B6] hover:text-[#5B21B6] text-center font-semibold"
                    >
                      Cancel withdrawal
                    </button>
                  </div>
                </div>
              </>

            )}
          </div>
        </div>
      )}
    </div>
  );
}