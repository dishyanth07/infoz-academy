import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle2, AlertCircle, Clock, Loader2, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  totalFees: number;
  paidAmount: number;
  status: 'Paid' | 'Pending' | 'Partially Paid';
  updatedAt: string;
}

export default function FeesStatus({ user }: { user: { username: string } }) {
  const [feeRecord, setFeeRecord] = useState<FeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeeStatus();
  }, [user.username]);

  const fetchFeeStatus = async () => {
    try {
      setLoading(true);
      // First find the student document to get the correct ID
      const studentsQuery = query(collection(db, 'students'), where('username', '==', user.username));
      const studentsSnapshot = await getDocs(studentsQuery);
      
      if (studentsSnapshot.empty) {
        setError('Student record not found');
        return;
      }

      const studentId = studentsSnapshot.docs[0].id;

      // Then fetch the fee record for this student
      const feesQuery = query(collection(db, 'fees'), where('studentId', '==', studentId));
      const feesSnapshot = await getDocs(feesQuery);

      if (!feesSnapshot.empty) {
        setFeeRecord({ ...feesSnapshot.docs[0].data(), id: feesSnapshot.docs[0].id } as FeeRecord);
      }
    } catch (err) {
      console.error('Error fetching fee status:', err);
      setError('Failed to load fee information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const balance = feeRecord ? feeRecord.totalFees - feeRecord.paidAmount : 0;
  const paidPercentage = feeRecord && feeRecord.totalFees > 0 
    ? Math.round((feeRecord.paidAmount / feeRecord.totalFees) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fees Status</h1>
          <p className="text-gray-500 mt-1">View your fee payment details and history</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {!feeRecord && !error ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="bg-gray-50 p-4 rounded-full w-fit mx-auto mb-6">
            <CreditCard className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Fee Record Found</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Your fee details haven't been updated by the administration yet. Please contact the office for more information.
          </p>
        </div>
      ) : feeRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Summary Cards */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="bg-indigo-50 p-3 rounded-xl w-fit mb-4">
                  <Wallet className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-gray-500 text-sm font-medium">Total Fees</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{feeRecord.totalFees.toLocaleString()}</h3>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="bg-green-50 p-3 rounded-xl w-fit mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-gray-500 text-sm font-medium">Paid Amount</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{feeRecord.paidAmount.toLocaleString()}</h3>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="bg-red-50 p-3 rounded-xl w-fit mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-gray-500 text-sm font-medium">Balance Due</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{balance.toLocaleString()}</h3>
              </motion.div>
            </div>

            {/* Payment Progress */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Payment Progress</h2>
                <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                  feeRecord.status === 'Paid' ? 'bg-green-100 text-green-600' :
                  feeRecord.status === 'Partially Paid' ? 'bg-blue-100 text-blue-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {feeRecord.status}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-500">Percentage Paid</span>
                  <span className="text-indigo-600">{paidPercentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${paidPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-4 rounded-full ${
                      paidPercentage === 100 ? 'bg-green-500' : 
                      paidPercentage > 50 ? 'bg-indigo-500' : 'bg-red-500'
                    }`}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Last updated on {new Date(feeRecord.updatedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions / Info */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-indigo-600 p-8 rounded-2xl shadow-lg shadow-indigo-100 text-white"
            >
              <TrendingUp className="w-8 h-8 mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">Payment Instructions</h3>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                Please visit the academy office to make your payments. We accept Cash, UPI, and Bank Transfers.
              </p>
              <button className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-50 transition-colors">
                <span>Contact Office</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Initial Deposit</p>
                    <p className="text-xs text-gray-500">Verified by Admin</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 opacity-60">
                  <div className="bg-gray-200 p-2 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Next Installment</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
