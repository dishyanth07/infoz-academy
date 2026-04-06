import { motion } from 'motion/react';
import { BookOpen, Download, Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Paper {
  id: string;
  title: string;
  subject: string;
  class: string;
  date: string;
}

export default function QuestionPapers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = (paper: any) => {
    if (paper.fileData) {
      const link = document.createElement('a');
      link.href = paper.fileData;
      link.download = paper.fileName || `${paper.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No soft copy available for this paper.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Question Papers</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search papers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Paper Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
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
                        <span className="font-bold text-gray-800">{paper.subject}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{paper.title}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                        {paper.class}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{paper.date}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDownload(paper)}
                        className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg hover:bg-indigo-50 transition-all"
                      >
                        <Download className="w-5 h-5" />
                      </button>
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
