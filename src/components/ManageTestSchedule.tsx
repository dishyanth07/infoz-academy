import { motion } from 'motion/react';
import { Calendar, Plus, Trash2, Edit2, Clock, MapPin, Loader2 } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import Modal from './Modal';

interface ScheduleItem {
  id: string;
  date: string;
  subject: string;
  time: string;
  room: string;
  status: string;
}

export default function ManageTestSchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    subject: 'Physics',
    time: '',
    room: '',
    status: 'Upcoming'
  });

  useEffect(() => {
    const q = query(collection(db, 'testSchedules'), orderBy('date'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scheduleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduleItem[];
      setSchedule(scheduleData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (item?: ScheduleItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        date: item.date,
        subject: item.subject,
        time: item.time,
        room: item.room,
        status: item.status
      });
    } else {
      setEditingItem(null);
      setFormData({
        date: '',
        subject: 'Physics',
        time: '',
        room: '',
        status: 'Upcoming'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'testSchedules', editingItem.id), formData);
      } else {
        await addDoc(collection(db, 'testSchedules'), formData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this test schedule?')) {
      try {
        await deleteDoc(doc(db, 'testSchedules', id));
      } catch (error) {
        console.error('Error deleting schedule:', error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Manage Test Schedule</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center space-x-2 font-bold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Test</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {schedule.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-6">
                <div className="bg-indigo-50 p-4 rounded-2xl">
                  <Calendar className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{item.subject}</h3>
                  <p className="text-gray-500 font-medium">{item.date}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 md:gap-12">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 font-medium">{item.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 font-medium">{item.room}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => handleOpenModal(item)}
                  className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Test Schedule' : 'Add New Test'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="text"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. April 10, 2024"
              />
            </div>
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <input
              type="text"
              required
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. 10:00 AM - 01:00 PM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room / Location</label>
            <input
              type="text"
              required
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Room 101"
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              {editingItem ? 'Update Test' : 'Add Test'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
