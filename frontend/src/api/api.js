import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await api.post('/login', { username, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Logout failed' };
    }
  },
};

// Employee API
export const employeeAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/employees');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employees' };
    }
  },

  create: async (employeeData) => {
    try {
      const response = await api.post('/employees', employeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create employee' };
    }
  },
};

// Department API
export const departmentAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/departments');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch departments' };
    }
  },

  create: async (departmentData) => {
    try {
      const response = await api.post('/departments', departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create department' };
    }
  },
};

// Salary API
export const salaryAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/salaries');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch salaries' };
    }
  },

  create: async (salaryData) => {
    try {
      const response = await api.post('/salaries', salaryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create salary record' };
    }
  },

  update: async (id, salaryData) => {
    try {
      const response = await api.put(`/salaries/${id}`, salaryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update salary record' };
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/salaries/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete salary record' };
    }
  },
};

// Employee-Department API
export const employeeDepartmentAPI = {
  assign: async (assignmentData) => {
    try {
      const response = await api.post('/employee-department', assignmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign employee to department' };
    }
  },
};

// Report API
export const reportAPI = {
  getMonthlyReport: async (month, year) => {
    try {
      const response = await api.get('/reports/monthly', { params: { month, year } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate report' };
    }
  },
};

export default api;
