import { motion } from 'motion/react';
import { Users, FileText, BookOpen, Calendar, TrendingUp, UserPlus, Clock, Loader2, Database, CheckCircle2, CreditCard, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, writeBatch, doc, setDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    { name: 'Total Students', value: '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Fees Collected', value: '₹0', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Avg Attendance', value: '0%', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Question Papers', value: '0', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Tests Scheduled', value: '0', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Marks Entered', value: '0', icon: Award, color: 'text-pink-600', bg: 'bg-pink-100' },
  ]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchStats = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const notesSnapshot = await getDocs(collection(db, 'notes'));
      const papersSnapshot = await getDocs(collection(db, 'questionPapers'));
      const testsSnapshot = await getDocs(collection(db, 'testSchedules'));
      const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
      const feesSnapshot = await getDocs(collection(db, 'fees'));
      const marksSnapshot = await getDocs(collection(db, 'marks'));

      let totalFeesCollected = 0;
      feesSnapshot.docs.forEach(doc => {
        totalFeesCollected += doc.data().paidAmount || 0;
      });

      let totalPresent = 0;
      let totalMarked = 0;
      attendanceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        Object.values(data).forEach(status => {
          if (status === 'present' || status === 'absent') {
            totalMarked++;
            if (status === 'present') totalPresent++;
          }
        });
      });

      const avgAttendance = totalMarked > 0 ? `${Math.round((totalPresent / totalMarked) * 100)}%` : '0%';

      setStats(prev => prev.map(stat => {
        if (stat.name === 'Total Students') return { ...stat, value: studentsSnapshot.size.toString() };
        if (stat.name === 'Fees Collected') return { ...stat, value: `₹${totalFeesCollected.toLocaleString()}` };
        if (stat.name === 'Avg Attendance') return { ...stat, value: avgAttendance };
        if (stat.name === 'Question Papers') return { ...stat, value: papersSnapshot.size.toString() };
        if (stat.name === 'Tests Scheduled') return { ...stat, value: testsSnapshot.size.toString() };
        if (stat.name === 'Marks Entered') return { ...stat, value: marksSnapshot.size.toString() };
        return stat;
      }));
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const seedDemoData = async () => {
    if (!window.confirm('This will add sample data to your database. Continue?')) return;
    
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);

      // Dummy Students
      const students = [
        { name: 'Arjun Kumar', email: 'arjun@example.com', phone: '9876543210', class: 'Class 12', status: 'Active', username: 'arjun', password: 'password123' },
        { name: 'Priya Sharma', email: 'priya@example.com', phone: '9876543211', class: 'Class 12', status: 'Active', username: 'priya', password: 'password123' },
        { name: 'Rahul Verma', email: 'rahul@example.com', phone: '9876543212', class: 'Class 11', status: 'Active', username: 'rahul', password: 'password123' },
        { name: 'Ananya Iyer', email: 'ananya@example.com', phone: '9876543213', class: 'Class 10', status: 'Inactive', username: 'ananya', password: 'password123' },
      ];

      // Dummy Notes
      const notes = [
        { title: 'Quantum Mechanics Basics', subject: 'Physics', date: 'Mar 20, 2024', size: '2.4 MB' },
        { title: 'Organic Chemistry: Alkanes', subject: 'Chemistry', date: 'Mar 18, 2024', size: '1.8 MB' },
        { title: 'Calculus: Derivatives', subject: 'Mathematics', date: 'Mar 15, 2024', size: '3.1 MB' },
      ];

      // Dummy Question Papers
      const papers = [
        { title: 'Final Exam 2023', subject: 'Physics', class: 'Class 12', date: 'Dec 2023' },
        { title: 'Mid-Term 2023', subject: 'Chemistry', class: 'Class 12', date: 'Oct 2023' },
        { title: 'Unit Test 3', subject: 'Mathematics', class: 'Class 11', date: 'Feb 2024' },
      ];

      // Dummy Test Schedules
      const schedules = [
        { date: '2024-04-10', subject: 'Physics', time: '10:00 AM - 01:00 PM', room: 'Room 101', status: 'Upcoming' },
        { date: '2024-04-12', subject: 'Chemistry', time: '10:00 AM - 01:00 PM', room: 'Room 102', status: 'Upcoming' },
        { date: '2024-04-15', subject: 'Mathematics', time: '10:00 AM - 01:00 PM', room: 'Main Hall', status: 'Upcoming' },
      ];

      // Add to batch
      students.forEach(s => addDoc(collection(db, 'students'), s));
      notes.forEach(n => addDoc(collection(db, 'notes'), n));
      papers.forEach(p => addDoc(collection(db, 'questionPapers'), p));
      schedules.forEach(sc => addDoc(collection(db, 'testSchedules'), sc));

      // Add students and get their IDs for attendance seeding
      const studentRefs = await Promise.all(students.map(s => addDoc(collection(db, 'students'), s)));
      
      // Seed attendance for the last 5 days
      const attendancePromises = [];
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const attendanceData: Record<string, string> = {};
        studentRefs.forEach(ref => {
          // Randomly assign present/absent for demo
          attendanceData[ref.id] = Math.random() > 0.2 ? 'present' : 'absent';
        });
        
        attendancePromises.push(setDoc(doc(db, 'attendance', dateStr), attendanceData));
      }

      // Seed fees
      const feePromises = studentRefs.map(ref => {
        const student = students[studentRefs.indexOf(ref)];
        const totalFees = 5000 + Math.floor(Math.random() * 5000);
        const paidAmount = Math.floor(Math.random() * totalFees);
        let status: 'Paid' | 'Pending' | 'Partially Paid' = 'Pending';
        if (paidAmount >= totalFees) status = 'Paid';
        else if (paidAmount > 0) status = 'Partially Paid';

        return setDoc(doc(db, 'fees', ref.id), {
          studentId: ref.id,
          studentName: student.name,
          totalFees,
          paidAmount,
          status,
          updatedAt: new Date().toISOString()
        });
      });

      // Seed marks
      const marksPromises: any[] = [];
      const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'];
      const tests = ['Unit Test 1', 'Mid-Term Exam', 'Unit Test 2'];

      studentRefs.forEach(ref => {
        const student = students[studentRefs.indexOf(ref)];
        subjects.forEach(subject => {
          tests.forEach(test => {
            const totalMarks = 100;
            const marksObtained = 40 + Math.floor(Math.random() * 60);
            marksPromises.push(addDoc(collection(db, 'marks'), {
              studentId: ref.id,
              studentName: student.name,
              subject,
              testName: test,
              marksObtained,
              totalMarks,
              date: new Date().toISOString().split('T')[0]
            }));
          });
        });
      });

      await Promise.all([
        ...notes.map(n => addDoc(collection(db, 'notes'), n)),
        ...papers.map(p => addDoc(collection(db, 'questionPapers'), p)),
        ...schedules.map(sc => addDoc(collection(db, 'testSchedules'), sc)),
        ...attendancePromises,
        ...feePromises,
        ...marksPromises
      ]);

      alert('Demo data seeded successfully!');
      fetchStats();
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Failed to seed data.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your academy and track student progress.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={seedDemoData}
            disabled={isSeeding}
            className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 rounded-2xl shadow-sm flex items-center space-x-2 font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {isSeeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
            <span>Seed Demo Data</span>
          </button>
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center space-x-2 font-bold hover:bg-indigo-700 transition-colors">
            <UserPlus className="w-5 h-5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className={`${stat.bg} p-3 rounded-xl w-fit mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-gray-500 text-sm font-medium">{stat.name}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <button className="text-indigo-600 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-6">
            {[
              { action: 'New student registered', user: 'Sarah Miller', time: '10 mins ago', icon: UserPlus, color: 'bg-blue-50 text-blue-600' },
              { action: 'Uploaded Physics Unit 3 Notes', user: 'Admin', time: '45 mins ago', icon: FileText, color: 'bg-green-50 text-green-600' },
              { action: 'Scheduled Mathematics Test', user: 'Admin', time: '2 hours ago', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
              { action: 'Updated Question Paper: Chemistry', user: 'Admin', time: '5 hours ago', icon: BookOpen, color: 'bg-orange-50 text-orange-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  <div className={`${item.color} p-2 rounded-lg`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{item.action}</p>
                    <p className="text-sm text-gray-500">By {item.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 font-medium flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.time}
                  </span>
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
          <h2 className="text-xl font-bold text-gray-900 mb-8">Quick Analytics</h2>
          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 font-medium">Student Engagement</span>
                <span className="text-indigo-600 font-bold">85%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 font-medium">Material Usage</span>
                <span className="text-green-600 font-bold">62%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 font-medium">Test Completion</span>
                <span className="text-purple-600 font-bold">94%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-indigo-50 rounded-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-indigo-900">Growth Stats</h3>
            </div>
            <p className="text-sm text-indigo-700 font-medium">Your academy has grown by <span className="font-bold">12%</span> this month. Keep it up!</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
