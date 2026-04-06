import { motion } from 'motion/react';
import { BookOpen, Calendar, FileText, GraduationCap, TrendingUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';

interface DashboardProps {
  user: { username: string; role: string };
}

export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState([
    { name: 'Active Classes', value: '12', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Attendance', value: '94%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Notes Available', value: '0', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Upcoming Tests', value: '0', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const notesSnapshot = await getDocs(collection(db, 'notes'));
        const testsSnapshot = await getDocs(query(collection(db, 'testSchedules'), where('status', '==', 'Upcoming')));
        
        // Find student ID by username
        const studentsQuery = query(collection(db, 'students'), where('username', '==', user.username));
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentDoc = studentsSnapshot.docs[0];

        let attendancePercent = '0%';
        let attendanceStats = { present: 0, absent: 0, total: 0 };

        if (studentDoc) {
          const studentId = studentDoc.id;
          const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
          
          attendanceSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data[studentId]) {
              attendanceStats.total++;
              if (data[studentId] === 'present') {
                attendanceStats.present++;
              } else if (data[studentId] === 'absent') {
                attendanceStats.absent++;
              }
            }
          });

          if (attendanceStats.total > 0) {
            attendancePercent = `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%`;
          }
        }

        setStats(prev => prev.map(stat => {
          if (stat.name === 'Notes Available') return { ...stat, value: notesSnapshot.size.toString() };
          if (stat.name === 'Upcoming Tests') return { ...stat, value: testsSnapshot.size.toString() };
          if (stat.name === 'Attendance') return { ...stat, value: attendancePercent };
          return stat;
        }));
        
        setDetailedAttendance(attendanceStats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.username]);

  const [detailedAttendance, setDetailedAttendance] = useState({ present: 0, absent: 0, total: 0 });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.username}! 👋</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your studies today.</p>
        </div>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 flex items-center space-x-3">
          <GraduationCap className="w-6 h-6" />
          <span className="font-semibold">Student Portal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">{stat.name}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Attendance Detail Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Attendance Overview</h2>
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Present</span>
            <div className="w-3 h-3 rounded-full bg-red-500 ml-2"></div>
            <span>Absent</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-gray-500 text-sm font-medium">Present Days</p>
                <p className="text-3xl font-bold text-gray-900">{detailedAttendance.present}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm font-medium">Total Days</p>
                <p className="text-xl font-bold text-gray-400">{detailedAttendance.total}</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex">
              <div 
                className="bg-green-500 h-full transition-all duration-500" 
                style={{ width: `${detailedAttendance.total > 0 ? (detailedAttendance.present / detailedAttendance.total) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-red-500 h-full transition-all duration-500" 
                style={{ width: `${detailedAttendance.total > 0 ? (detailedAttendance.absent / detailedAttendance.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
            <p className="text-gray-500 text-sm font-medium mb-1">Overall Percentage</p>
            <p className="text-4xl font-black text-indigo-600">
              {detailedAttendance.total > 0 ? Math.round((detailedAttendance.present / detailedAttendance.total) * 100) : 0}%
            </p>
          </div>

          <div className="flex flex-col justify-center space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <span className="text-green-700 font-bold">Present</span>
              <span className="text-green-700 font-bold">{detailedAttendance.present}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <span className="text-red-700 font-bold">Absent</span>
              <span className="text-red-700 font-bold">{detailedAttendance.absent}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Announcements</h2>
          <div className="space-y-6">
            {[
              { title: 'New Physics Notes Uploaded', time: '2 hours ago', type: 'Notes' },
              { title: 'Mathematics Test Scheduled', time: '5 hours ago', type: 'Test' },
              { title: 'Holiday Notice: Good Friday', time: '1 day ago', type: 'Holiday' },
            ].map((item, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0"></div>
                <div>
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">{item.type}</span>
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Schedule</h2>
          <div className="space-y-4">
            {[
              { subject: 'Advanced Mathematics', time: '10:00 AM - 12:00 PM', date: 'Today' },
              { subject: 'Physics Lab', time: '02:00 PM - 04:00 PM', date: 'Today' },
              { subject: 'Chemistry Theory', time: '09:00 AM - 11:00 AM', date: 'Tomorrow' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors duration-200">
                <div>
                  <p className="font-bold text-gray-800">{item.subject}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-white px-3 py-1 rounded-lg shadow-sm">{item.date}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
