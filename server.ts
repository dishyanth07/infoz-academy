import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const JWT_SECRET = process.env.JWT_SECRET || 'infoz-academy-secret-key';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    // 1. Demo data check (as requested: "dont dont remove the demo id password both has to be there demo and original")
    if (username === 'student1' && password === '1234') {
      const token = jwt.sign({ username, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token, role: 'student', username });
    }
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token, role: 'admin', username });
    }

    // 2. Check Firestore for original student credentials
    try {
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('username', '==', username), where('password', '==', password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentData = querySnapshot.docs[0].data();
        const token = jwt.sign({ username, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token, role: 'student', username });
      }
    } catch (error) {
      console.error('Error checking Firestore for user:', error);
    }
    
    res.status(401).json({ message: 'Invalid credentials' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
