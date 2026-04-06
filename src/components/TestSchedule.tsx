import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface ScheduleItem {
  id: string;
  date: string;
  subject: string;
  time: string;
  room: string;
  status: string;
}

export default function TestSchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const nextTest = schedule.find(item => item.status === 'Upcoming');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Test Schedule</h1>
        {nextTest && (
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-orange-800 font-medium">Next test: {nextTest.subject} on {nextTest.date}</p>
          </div>
        )}
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-center space-x-6">
                <div className="bg-indigo-50 p-4 rounded-2xl group-hover:bg-indigo-600 transition-colors duration-200">
                  <Calendar className="w-8 h-8 text-indigo-600 group-hover:text-white" />
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

              <div className="flex items-center">
                <span className="px-4 py-2 rounded-xl bg-green-50 text-green-600 font-bold text-sm">
                  {item.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
