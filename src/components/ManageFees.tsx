import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Search, Loader2, Save, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  username: string;
}

interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  totalFees: number;
  paidAmount: number;
  status: 'Paid' | 'Pending' | 'Partially Paid';
  updatedAt: string;
}

export default function ManageFees() {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Record<string, FeeRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentsList);

      const feesSnapshot = await getDocs(collection(db, 'fees'));
      const feesMap: Record<string, FeeRecord> = {};
      feesSnapshot.docs.forEach(doc => {
        const data = doc.data() as FeeRecord;
        feesMap[data.studentId] = { ...data, id: doc.id };
      });
      setFees(feesMap);
    } catch (err) {
      console.error('Error fetching fees data:', err);
      setError('Failed to load fees data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFee = async (student: Student, total: number, paid: number) => {
    try {
      setSaving(student.id);
      let status: 'Paid' | 'Pending' | 'Partially Paid' = 'Pending';
      if (paid >= total && total > 0) status = 'Paid';
      else if (paid > 0) status = 'Partially Paid';

      const feeData = {
        studentId: student.id,
        studentName: student.name,
        totalFees: total,
        paidAmount: paid,
        status,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'fees', student.id), feeData);
      
      setFees(prev => ({
        ...prev,
        [student.id]: { ...feeData, id: student.id }
      }));
    } catch (err) {
      console.error('Error updating fee:', err);
      setError('Failed to update fee record');
    } finally {
      setSaving(null);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fees Management</h1>
          <p className="text-gray-500 mt-1">Track and update student fee records</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-full md:w-64"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Student Name</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Total Fees (₹)</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Paid Amount (₹)</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Balance (₹)</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((student) => {
                const record = fees[student.id] || {
                  totalFees: 0,
                  paidAmount: 0,
                  status: 'Pending'
                };
                
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">@{student.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        defaultValue={record.totalFees}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (val !== record.totalFees) {
                            handleUpdateFee(student, val, record.paidAmount);
                          }
                        }}
                        className="w-24 px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        defaultValue={record.paidAmount}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (val !== record.paidAmount) {
                            handleUpdateFee(student, record.totalFees, val);
                          }
                        }}
                        className="w-24 px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{(record.totalFees - record.paidAmount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit space-x-1 ${
                        record.status === 'Paid' ? 'bg-green-100 text-green-600' :
                        record.status === 'Partially Paid' ? 'bg-blue-100 text-blue-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {record.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                        {record.status === 'Partially Paid' && <Clock className="w-3 h-3" />}
                        {record.status === 'Pending' && <AlertCircle className="w-3 h-3" />}
                        <span>{record.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {saving === student.id ? (
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      ) : (
                        <button 
                          className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center space-x-1"
                          onClick={() => handleUpdateFee(student, record.totalFees, record.paidAmount)}
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
