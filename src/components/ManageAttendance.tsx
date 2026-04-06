import { motion } from 'motion/react';
import { Users, Calendar, CheckCircle2, XCircle, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, onSnapshot, setDoc, doc, getDoc } from 'firebase/firestore';

interface Student {
  id: string;
  name: string;
  class: string;
  email: string;
}

interface AttendanceRecord {
  [studentId: string]: 'present' | 'absent';
}

export default function ManageAttendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'attendance', selectedDate);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAttendance(docSnap.data() as AttendanceRecord);
        } else {
          setAttendance({});
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedDate]);

  const toggleAttendance = (studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? undefined : status
    }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'attendance', selectedDate), attendance);
      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status: 'present' | 'absent') => {
    const newAttendance = { ...attendance };
    filteredStudents.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent: Object.values(attendance).filter(v => v === 'absent').length,
    unmarked: students.length - Object.values(attendance).filter(v => v !== undefined).length
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Register</h1>
          <p className="text-gray-500 mt-1">Mark and manage student attendance.</p>
        </div>
        <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="font-bold text-gray-800 outline-none cursor-pointer"
          />
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: 'Total Students', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { name: 'Present', value: stats.present, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
          { name: 'Absent', value: stats.absent, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
          { name: 'Unmarked', value: stats.unmarked, icon: Calendar, color: 'text-gray-600', bg: 'bg-gray-100' },
        ].map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">{stat.name}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => markAll('present')}
              className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl font-bold hover:bg-green-100 transition-colors flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>All Present</span>
            </button>
            <button 
              onClick={() => markAll('absent')}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>All Absent</span>
            </button>
            <button 
              onClick={saveAttendance}
              disabled={saving}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>Save Attendance</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                        {student.class}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => toggleAttendance(student.id, 'present')}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${
                            attendance[student.id] === 'present'
                              ? 'bg-green-50 border-green-200 text-green-600 font-bold'
                              : 'bg-white border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Present</span>
                        </button>
                        <button
                          onClick={() => toggleAttendance(student.id, 'absent')}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${
                            attendance[student.id] === 'absent'
                              ? 'bg-red-50 border-red-200 text-red-600 font-bold'
                              : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600'
                          }`}
                        >
                          <XCircle className="w-5 h-5" />
                          <span>Absent</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
