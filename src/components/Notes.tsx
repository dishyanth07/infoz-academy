import { motion } from 'motion/react';
import { FileText, Download, Search, Filter, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Note {
  id: string;
  title: string;
  subject: string;
  date: string;
  size: string;
}

export default function Notes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'notes'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(notesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (note: any) => {
    if (note.fileData) {
      const link = document.createElement('a');
      link.href = note.fileData;
      link.download = note.fileName || `${note.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No soft copy available for this note.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Study Notes</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64 outline-none transition-all"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-600 transition-colors duration-200">
                  <FileText className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  {note.subject}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{note.title}</h3>
              <p className="text-sm text-gray-500 mb-6">Uploaded on {note.date}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-xs font-medium text-gray-400">{note.size || (note as any).fileSize || 'N/A'}</span>
                <button 
                  onClick={() => handleDownload(note)}
                  className="flex items-center space-x-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
