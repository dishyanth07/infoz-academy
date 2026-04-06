export type Role = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  username: string;
  role: Role;
  name: string;
  email: string;
  contact: string;
  createdAt: string;
}

export interface Note {
  id: string;
  subject: string;
  title: string;
  pdfUrl: string;
  uploadedAt: string;
}

export interface QuestionPaper {
  id: string;
  subject: string;
  title: string;
  pdfUrl: string;
  class: string;
  uploadedAt: string;
}

export interface TestSchedule {
  id: string;
  date: string;
  subject: string;
  time: string;
}
