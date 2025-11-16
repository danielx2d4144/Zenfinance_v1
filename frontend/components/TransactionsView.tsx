"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, CheckCircle, XCircle, Search, Download, Filter, ExternalLink, ArrowUpRight, ArrowDownRight, RotateCcw, DollarSign, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";
import { useTransactionHistory, Transaction } from "@/hooks/useTransactionHistory";



const getTransactionIcon = (type: string) => {
  switch (type) {
    case "supply":
      return <ArrowDownRight className="w-4 h-4 text-green-400" />;
    case "withdraw":
      return <ArrowUpRight className="w-4 h-4 text-blue-400" />;
    case "borrow":
      return <DollarSign className="w-4 h-4 text-purple-400" />;
    case "repay":
      return <RotateCcw className="w-4 h-4 text-orange-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-400" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const getTransactionColor = (type: string) => {
  switch (type) {
    case "supply":
      return "text-green-400";
    case "withdraw":
      return "text-blue-400";
    case "borrow":
      return "text-purple-400";
    case "repay":
      return "text-orange-400";
    default:
      return "text-gray-400";
  }
};

export default function TransactionsView() {
  const { isConnected, address } = useAccount();
  const { transactions, isLoading, error, refetch } = useTransactionHistory();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "failed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "supply" | "withdraw" | "borrow" | "repay">("all");

  // Filter transactions based on search and filters
  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, typeFilter]);

  const exportTransactions = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Type,Asset,Amount,Amount USD,Status,Hash,Timestamp\n" +
      filteredTransactions.map(tx => 
        `${tx.type},${tx.asset},${tx.amount},${tx.amountUSD},${tx.status},${tx.hash},${new Date(tx.timestamp).toISOString()}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "zenfinance_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-6 text-sm animate-fade-in">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gradient-zen transition-colors duration-300"
          >
            Dashboard
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white">Transactions</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
            <p className="text-gray-400">Track all your lending and borrowing activities</p>
          </div>
        </div>

        {/* Connect Wallet Card */}
        <div className="max-w-md mx-auto mt-16">
          <div className="bg-gradient-to-br from-[#1a2332] to-[#0f1422] rounded-2xl border border-white/10 p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 rounded-full flex items-center justify-center border border-green-400/30">
              <Clock className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Please Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to view your transaction history and track all your lending activities.
            </p>
            <button className="w-full py-3 px-6 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 hover-glow">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm animate-fade-in">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-gradient-zen transition-colors duration-300"
        >
          Dashboard
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white">Transactions</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
            <p className="text-gray-400">Track all your lending and borrowing activities</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportTransactions}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/10 via-green-400/10 to-cyan-400/10 hover:from-yellow-400/20 hover:via-green-400/20 hover:to-cyan-400/20 text-white rounded-xl border border-green-400/30 hover:border-green-400/50 transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gradient-to-br from-[#1a2332] to-[#0f1422] rounded-2xl border border-white/10 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by asset, transaction hash, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50 transition-all duration-300"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50 transition-all duration-300"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="min-w-[140px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-400/50 transition-all duration-300"
            >
              <option value="all">All Types</option>
              <option value="supply">Supply</option>
              <option value="withdraw">Withdraw</option>
              <option value="borrow">Borrow</option>
              <option value="repay">Repay</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-gradient-to-br from-[#1a2332] to-[#0f1422] rounded-2xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-green-400 mb-4" />
            <div className="text-gray-400">Loading transactions...</div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Transactions</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button 
              onClick={refetch}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Transactions Found</h3>
            <p className="text-gray-400">
              {transactions.length === 0 
                ? "You haven't made any transactions yet. Start by supplying or borrowing assets."
                : "No transactions match your current filters. Try adjusting your search criteria."
              }
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Header */}
            <div className="hidden lg:grid lg:grid-cols-[2fr_1.2fr_1fr_1fr_1.5fr_80px] gap-6 p-6 border-b border-white/10 text-sm font-medium text-gray-400">
              <div>Transaction</div>
              <div>Amount</div>
              <div>Asset</div>
              <div>Status</div>
              <div>Time</div>
              <div>Action</div>
            </div>

            {/* Transaction Items */}
            <div className="divide-y divide-white/5">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-6 hover:bg-white/5 transition-all duration-300"
                >
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className={`font-semibold capitalize ${getTransactionColor(transaction.type)}`}>
                            {transaction.type}
                          </p>
                          <p className="text-sm text-gray-400">{transaction.asset}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className={`text-sm font-medium ${
                          transaction.status === 'confirmed' ? 'text-green-400' :
                          transaction.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">{transaction.amount} {transaction.asset}</p>
                        <p className="text-sm text-gray-400">{transaction.amountUSD}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {formatDistanceToNow(transaction.timestamp, { addSuffix: true })}
                        </p>
                        <a
                          href={`https://zentrace.io/tx/${transaction.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:grid lg:grid-cols-[2fr_1.2fr_1fr_1fr_1.5fr_80px] gap-6 items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      {getTransactionIcon(transaction.type)}
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold capitalize ${getTransactionColor(transaction.type)}`}>
                          {transaction.type}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]" title={transaction.hash}>
                          {transaction.hash}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{transaction.amount}</p>
                      <p className="text-sm text-gray-400 truncate">{transaction.amountUSD}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-xs border border-green-400/30 flex-shrink-0">
                          {transaction.asset[0]}
                        </div>
                        <span className="text-white font-medium truncate">{transaction.asset}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className={`font-medium capitalize truncate ${
                          transaction.status === 'confirmed' ? 'text-green-400' :
                          transaction.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">
                        {formatDistanceToNow(transaction.timestamp, { addSuffix: true })}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <a
                        href={`https://zentrace.io/tx/${transaction.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {transactions.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
        </div>
      )}
    </div>
  );
}