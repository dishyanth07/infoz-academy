import { motion } from 'motion/react';
import { Calendar, CheckCircle2, XCircle, Loader2, History } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';

interface AttendanceHistoryProps {
  username: string;
}

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent';
}

export default function AttendanceHistory({ username }: AttendanceHistoryProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    // First, find the student ID for the given username
    const findStudent = async () => {
      try {
        const q = query(collection(db, 'students'), where('username', '==', username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setStudentId(querySnapshot.docs[0].id);
        }
      } catch (error) {
        console.error('Error finding student:', error);
      }
    };

    findStudent();
  }, [username]);

  useEffect(() => {
    if (!studentId) return;

    // Fetch all attendance records and filter for this student
    const unsubscribe = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const history: AttendanceRecord[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data[studentId]) {
          history.push({
            date: doc.id,
            status: data[studentId]
          });
        }
      });
      
      // Sort by date descending
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(history);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <History className="w-6 h-6 mr-3 text-indigo-600" />
          Attendance History
        </h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-500">Present</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-500">Absent</span>
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No attendance records found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record, index) => (
            <motion.div
              key={record.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border flex items-center justify-between ${
                record.status === 'present' 
                  ? 'bg-green-50 border-green-100' 
                  : 'bg-red-50 border-red-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  record.status === 'present' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">
                    {new Date(record.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                record.status === 'present' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
              }`}>
                {record.status === 'present' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                <span>{record.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
