import { motion } from 'motion/react';
import { BookOpen, Upload, Trash2, Edit2, Search, Loader2 } from 'lucide-react';
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import Modal from './Modal';

interface Paper {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string;
}

export default function ManageQuestionPapers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [formData, setFormData] = useState({
    title: '',
    subject: 'Physics',
    class: 'Class 12',
    fileData: '',
    fileName: '',
    fileSize: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'questionPapers'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const papersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Paper[];
      setPapers(papersData);
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

  const handleOpenModal = (paper?: Paper) => {
    if (paper) {
      setEditingPaper(paper);
      setFormData({
        title: paper.title,
        subject: paper.subject,
        class: paper.class,
        fileData: (paper as any).fileData || '',
        fileName: (paper as any).fileName || '',
        fileSize: (paper as any).fileSize || ''
      });
    } else {
      setEditingPaper(null);
      setFormData({
        title: '',
        subject: 'Physics',
        class: 'Class 12',
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
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
      if (editingPaper) {
        await updateDoc(doc(db, 'questionPapers', editingPaper.id), data);
      } else {
        await addDoc(collection(db, 'questionPapers'), data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving paper:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this paper?')) {
      try {
        await deleteDoc(doc(db, 'questionPapers', id));
      } catch (error) {
        console.error('Error deleting paper:', error);
      }
    }
  };

  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    paper.subject.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const suggestions = searchTerm.length > 1 
    ? papers
        .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Manage Question Papers</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center space-x-2 font-bold hover:bg-indigo-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Paper</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search papers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full outline-none transition-all"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                {suggestions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSearchTerm(p.title);
                      setDebouncedSearchTerm(p.title);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-2"
                  >
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>{p.title}</span>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Paper Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPapers.map((paper, index) => (
                  <motion.tr
                    key={paper.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{paper.title}</p>
                          <p className="text-xs text-indigo-600 font-bold uppercase">{paper.subject}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                        {paper.class}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{paper.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenModal(paper)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(paper.id)}
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
        title={editingPaper ? 'Edit Question Paper' : 'Upload Question Paper'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paper Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Final Exam 2023"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option>Class 10</option>
                <option>Class 11</option>
                <option>Class 12</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Question Paper (PDF/Image)</label>
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
              {editingPaper ? 'Update Paper' : 'Upload Paper'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
