import { motion } from 'motion/react';
import { Award, Plus, Trash2, Edit2, Search, Loader2, User } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import Modal from './Modal';

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

interface Student {
  id: string;
  name: string;
  class: string;
}

export default function ManageMarks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMark, setEditingMark] = useState<Mark | null>(null);

  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    subject: 'Physics',
    testName: '',
    marksObtained: 0,
    totalMarks: 100,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchStudents = async () => {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        class: doc.data().class
      })) as Student[];
      setStudents(studentsData);
    };

    fetchStudents();

    const q = query(collection(db, 'marks'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const marksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mark[];
      setMarks(marksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (mark?: Mark) => {
    if (mark) {
      setEditingMark(mark);
      setFormData({
        studentId: mark.studentId,
        studentName: mark.studentName,
        subject: mark.subject,
        testName: mark.testName,
        marksObtained: mark.marksObtained,
        totalMarks: mark.totalMarks,
        date: mark.date
      });
    } else {
      setEditingMark(null);
      setFormData({
        studentId: students[0]?.id || '',
        studentName: students[0]?.name || '',
        subject: 'Physics',
        testName: '',
        marksObtained: 0,
        totalMarks: 100,
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setFormData({
        ...formData,
        studentId: student.id,
        studentName: student.name
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingMark) {
        await updateDoc(doc(db, 'marks', editingMark.id), formData);
      } else {
        await addDoc(collection(db, 'marks'), formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving marks:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this mark record?')) {
      try {
        await deleteDoc(doc(db, 'marks', id));
      } catch (error) {
        console.error('Error deleting marks:', error);
      }
    }
  };

  const filteredMarks = marks.filter(mark => 
    mark.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mark.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mark.testName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Manage Marks</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center space-x-2 font-bold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Marks</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, subject or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Subject & Test</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Marks</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMarks.map((mark, index) => (
                  <motion.tr
                    key={mark.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="font-bold text-gray-800">{mark.studentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-800">{mark.testName}</p>
                        <p className="text-xs text-indigo-600 font-bold uppercase">{mark.subject}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{mark.marksObtained}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-500">{mark.totalMarks}</span>
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full ml-2",
                          (mark.marksObtained / mark.totalMarks) >= 0.4 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {Math.round((mark.marksObtained / mark.totalMarks) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{mark.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(mark)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(mark.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMark ? 'Edit Marks' : 'Add New Marks'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
            <select
              required
              value={formData.studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select a student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name} ({student.class})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
            <input
              type="text"
              required
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Unit Test 1, Final Exam"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Mathematics</option>
                <option>Biology</option>
                <option>English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
              <input
                type="number"
                required
                min="0"
                max={formData.totalMarks}
                value={formData.marksObtained}
                onChange={(e) => setFormData({ ...formData, marksObtained: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input
                type="number"
                required
                min="1"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              {editingMark ? 'Update Marks' : 'Save Marks'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
