import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read firebase config safely
let firebaseConfig;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else {
    // Fallback for different environments
    const altPath = path.resolve(__dirname, 'firebase-applet-config.json');
    firebaseConfig = JSON.parse(fs.readFileSync(altPath, 'utf-8'));
  }
} catch (err) {
  console.error('Failed to load Firebase config:', err);
}

const JWT_SECRET = process.env.JWT_SECRET || 'infoz-academy-secret-key';

// Initialize Firebase only if config is loaded
let db: any;
if (firebaseConfig) {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!db) {
    return res.status(500).json({ message: 'Database not initialized' });
  }

  // 1. Demo data check
  if (username === 'student1' && password === '1234') {
    const token = jwt.sign({ username, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, role: 'student', username });
  }
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, role: 'admin', username });
  }

  // 2. Check Firestore
  try {
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, where('username', '==', username), where('password', '==', password));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const token = jwt.sign({ username, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token, role: 'student', username });
    }
  } catch (error) {
    console.error('Error checking Firestore:', error);
  }
  
  res.status(401).json({ message: 'Invalid credentials' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    // Only serve index.html if it's not an API route
    if (!req.path.startsWith('/api/')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Not Found');
      }
    } else {
      res.status(404).json({ message: 'API route not found' });
    }
  });
} else {
  // Local development with Vite
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
