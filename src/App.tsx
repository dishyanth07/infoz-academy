/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Notes from './components/Notes';
import QuestionPapers from './components/QuestionPapers';
import TestSchedule from './components/TestSchedule';
import AdminDashboard from './components/AdminDashboard';
import ManageStudents from './components/ManageStudents';
import ManageNotes from './components/ManageNotes';
import ManageQuestionPapers from './components/ManageQuestionPapers';
import ManageTestSchedule from './components/ManageTestSchedule';
import ManageAttendance from './components/ManageAttendance';
import ManageFees from './components/ManageFees';
import FeesStatus from './components/FeesStatus';
import ManageMarks from './components/ManageMarks';
import MarksView from './components/MarksView';

export default function App() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData: { username: string; role: string; token: string }) => {
    localStorage.setItem('user', JSON.stringify({ username: userData.username, role: userData.role }));
    localStorage.setItem('token', userData.token);
    setUser({ username: userData.username, role: userData.role });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {user.role === 'student' ? (
            <>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/question-papers" element={<QuestionPapers />} />
              <Route path="/test-schedule" element={<TestSchedule />} />
              <Route path="/fees-status" element={<FeesStatus user={user} />} />
              <Route path="/marks" element={<MarksView user={user} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/manage-students" element={<ManageStudents />} />
              <Route path="/manage-notes" element={<ManageNotes />} />
              <Route path="/manage-question-papers" element={<ManageQuestionPapers />} />
              <Route path="/manage-test-schedule" element={<ManageTestSchedule />} />
              <Route path="/manage-attendance" element={<ManageAttendance />} />
              <Route path="/manage-fees" element={<ManageFees />} />
              <Route path="/manage-marks" element={<ManageMarks />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
}

