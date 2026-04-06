import { motion } from 'motion/react';
import { FileText, Upload, Trash2, Edit2, Search, Loader2 } from 'lucide-react';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import Modal from './Modal';

interface Note {
  id: string;
  title: string;
  subject: string;
  date: string;
  downloads: number;
}

export default function ManageNotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [formData, setFormData] = useState({
    title: '',
    subject: 'Physics',
    downloads: 0,
    fileData: '',
    fileName: '',
    fileSize: ''
  });

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          fileData: reader.result as string,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + ' KB'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        subject: note.subject,
        downloads: note.downloads,
        fileData: (note as any).fileData || '',
        fileName: (note as any).fileName || '',
        fileSize: (note as any).fileSize || ''
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        subject: 'Physics',
        downloads: 0,
        fileData: '',
        fileName: '',
        fileSize: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      };
      if (editingNote) {
        await updateDoc(doc(db, 'notes', editingNote.id), data);
      } else {
        await addDoc(collection(db, 'notes'), data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this note?')) {
      try {
        await deleteDoc(doc(db, 'notes', id));
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    note.subject.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const suggestions = searchTerm.length > 1 
    ? notes
        .filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Manage Notes</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center space-x-2 font-bold hover:bg-indigo-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Upload New Note</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes by title or subject..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full outline-none transition-all"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                {suggestions.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setSearchTerm(n.title);
                      setDebouncedSearchTerm(n.title);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>{n.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{note.title}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase">{note.subject}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">Uploaded on {note.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end mt-4 md:mt-0 gap-8">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Downloads</p>
                    <p className="text-lg font-bold text-gray-800">{note.downloads}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleOpenModal(note)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(note.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? 'Edit Note' : 'Upload New Note'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Quantum Mechanics Basics"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Soft Copy (PDF/Image)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-indigo-400 transition-colors cursor-pointer relative">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                    <span>{formData.fileName ? 'Change file' : 'Upload a file'}</span>
                    <input type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,image/*" />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                {formData.fileName && (
                  <p className="text-sm font-bold text-indigo-600 mt-2">{formData.fileName} ({formData.fileSize})</p>
                )}
              </div>
            </div>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              {editingNote ? 'Update Note' : 'Upload Note'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
