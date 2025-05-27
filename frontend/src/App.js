import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Message from './components/Message';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeePage from './pages/EmployeePage';
import DepartmentPage from './pages/DepartmentPage';
import SalaryPage from './pages/SalaryPage';
import ReportPage from './pages/ReportPage';

// Custom hook
import useAuth from './hooks/useAuth';

// Global message context
export const MessageContext = React.createContext();

// Message provider component
export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const addMessage = (type, text) => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, type, text }]);
    return id;
  };

  const removeMessage = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  return (
    <MessageContext.Provider value={{ addMessage, removeMessage }}>
      {children}
      <div className="fixed top-4 right-4 z-50 w-80">
        {messages.map(msg => (
          <Message
            key={msg.id}
            type={msg.type}
            message={msg.text}
            onClose={() => removeMessage(msg.id)}
          />
        ))}
      </div>
    </MessageContext.Provider>
  );
};

// Layout component that includes the Navbar
const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navbar />}
      <main>{children}</main>
    </>
  );
};

// App Routes with Authentication
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
      />

      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeePage />} />
        <Route path="/departments" element={<DepartmentPage />} />
        <Route path="/salaries" element={<SalaryPage />} />
        <Route path="/reports" element={<ReportPage />} />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <Router>
          <Layout>
            <AppRoutes />
          </Layout>
        </Router>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App;
