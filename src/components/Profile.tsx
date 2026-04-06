import { motion } from 'motion/react';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AttendanceHistory from './AttendanceHistory';

interface ProfileProps {
  user: { username: string; role: string };
}

interface StudentData {
  name: string;
  email: string;
  phone: string;
  class: string;
  status: string;
  studentId?: string;
  joinDate?: string;
  address?: string;
  dob?: string;
}

export default function Profile({ user }: ProfileProps) {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (user.role === 'student') {
        try {
          const q = query(collection(db, 'students'), where('username', '==', user.username));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data() as StudentData;
            setStudentData({
              ...data,
              studentId: querySnapshot.docs[0].id.slice(-8).toUpperCase(),
              joinDate: 'Jan 10, 2024', // Default for now
              address: '123 Academy Lane, Education City, TN', // Default for now
              dob: 'May 15, 2005', // Default for now
            });
          }
        } catch (error) {
          console.error('Error fetching student data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Admin profile
        setStudentData({
          name: 'Admin User',
          email: 'admin@infoz.com',
          phone: '9092330688',
          class: 'N/A',
          status: 'Active',
          studentId: 'ADMIN-001',
          joinDate: 'Jan 01, 2024',
          address: 'Main Office, Education City, TN',
          dob: 'N/A',
        });
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user.username, user.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center h-fit"
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold mb-6 shadow-xl shadow-indigo-100">
            {studentData.name[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{studentData.name}</h2>
          <p className="text-indigo-600 font-medium mt-1 uppercase tracking-wider text-sm">{user.role}</p>
          <div className="mt-6 w-full space-y-4">
            <div className="flex items-center justify-between text-sm py-3 border-b border-gray-50">
              <span className="text-gray-500">ID</span>
              <span className="font-bold text-gray-800">{studentData.studentId}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-3 border-b border-gray-50">
              <span className="text-gray-500">Joined On</span>
              <span className="font-bold text-gray-800">{studentData.joinDate}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
            <User className="w-6 h-6 mr-3 text-indigo-600" />
            Personal Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="text-gray-800 font-medium">{studentData.email}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="text-gray-800 font-medium">{studentData.phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Address</p>
                  <p className="text-gray-800 font-medium">{studentData.address}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Date of Birth</p>
                  <p className="text-gray-800 font-medium">{studentData.dob}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Current Class</p>
                  <p className="text-gray-800 font-medium">{studentData.class}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex justify-end">
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors duration-200">
              Edit Profile
            </button>
          </div>
        </motion.div>
      </div>

      {user.role === 'student' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AttendanceHistory username={user.username} />
        </motion.div>
      )}
    </div>
  );
}
