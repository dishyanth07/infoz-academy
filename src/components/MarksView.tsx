import { motion } from 'motion/react';
import { Award, TrendingUp, Calendar, Loader2, BookOpen, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';

interface Mark {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  testName: string;
  marksObtained: number;
  totalMarks: number;
  date: string;
}

interface MarksViewProps {
  user: { username: string; role: string };
}

export default function MarksView({ user }: MarksViewProps) {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const findStudentId = async () => {
      const q = query(collection(db, 'students'), where('username', '==', user.username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setStudentId(querySnapshot.docs[0].id);
      } else {
        // Fallback for demo student
        if (user.username === 'student1') {
           // We might need to seed a student with username student1 if it doesn't exist
           // For now, let's just set loading false if not found
           setLoading(false);
        }
      }
    };

    findStudentId();
  }, [user.username]);

  useEffect(() => {
    if (!studentId) return;

    const q = query(
      collection(db, 'marks'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const marksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mark[];
      setMarks(marksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studentId]);

  const averagePercentage = marks.length > 0
    ? Math.round(marks.reduce((acc, mark) => acc + (mark.marksObtained / mark.totalMarks), 0) / marks.length * 100)
    : 0;

  const totalTests = marks.length;
  const bestSubject = marks.length > 0
    ? marks.reduce((prev, current) => (prev.marksObtained / prev.totalMarks > current.marksObtained / current.totalMarks) ? prev : current).subject
    : 'N/A';

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
        <h1 className="text-3xl font-bold text-gray-900">My Performance</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-50 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{averagePercentage}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-50 p-3 rounded-xl">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tests Taken</p>
              <p className="text-2xl font-bold text-gray-900">{totalTests}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-50 p-3 rounded-xl">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Best Subject</p>
              <p className="text-2xl font-bold text-gray-900">{bestSubject}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Marks List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Test Results</h2>
        </div>

        {marks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No test results found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Test Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {marks.map((mark, index) => {
                  const percentage = Math.round((mark.marksObtained / mark.totalMarks) * 100);
                  return (
                    <motion.tr
                      key={mark.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-indigo-600 uppercase text-xs tracking-wider">{mark.subject}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">{mark.testName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">{mark.marksObtained}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-500">{mark.totalMarks}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{mark.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-4">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                percentage >= 75 ? "bg-green-500" : percentage >= 40 ? "bg-indigo-500" : "bg-red-500"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-sm font-bold px-3 py-1 rounded-full",
                            percentage >= 75 ? "bg-green-100 text-green-600" : percentage >= 40 ? "bg-indigo-100 text-indigo-600" : "bg-red-100 text-red-600"
                          )}>
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
