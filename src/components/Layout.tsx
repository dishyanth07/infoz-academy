import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  BookOpen, 
  Calendar, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  GraduationCap,
  Users,
  Settings,
  CheckCircle2,
  CreditCard,
  Award
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: ReactNode;
  user: { username: string; role: string };
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const studentNav = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Notes', path: '/notes', icon: FileText },
    { name: 'Question Papers', path: '/question-papers', icon: BookOpen },
    { name: 'Test Schedule', path: '/test-schedule', icon: Calendar },
    { name: 'Fees Status', path: '/fees-status', icon: CreditCard },
    { name: 'My Marks', path: '/marks', icon: Award },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Manage Students', path: '/manage-students', icon: Users },
    { name: 'Manage Attendance', path: '/manage-attendance', icon: CheckCircle2 },
    { name: 'Manage Notes', path: '/manage-notes', icon: FileText },
    { name: 'Manage Question Papers', path: '/manage-question-papers', icon: BookOpen },
    { name: 'Manage Test Schedule', path: '/manage-test-schedule', icon: Calendar },
    { name: 'Manage Fees', path: '/manage-fees', icon: CreditCard },
    { name: 'Manage Marks', path: '/manage-marks', icon: Award },
  ];

  const navigation = user.role === 'student' ? studentNav : adminNav;

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-xl lg:relative"
          >
            <div className="h-full flex flex-col">
              <div className="p-6 flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Infoz Academy</span>
              </div>

              <nav className="flex-1 px-4 space-y-2 mt-4">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-indigo-50 text-indigo-600 font-semibold" 
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="hidden md:block">
              <span className="text-sm font-medium text-gray-500">{currentDate}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 capitalize">{user.username}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user.username[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
