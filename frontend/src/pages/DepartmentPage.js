import React, { useState, useEffect, useContext } from 'react';
import { FiPlus, FiBriefcase } from 'react-icons/fi';
import { departmentAPI } from '../api/api';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import { MessageContext } from '../App';

const DepartmentPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addMessage } = useContext(MessageContext);
  const [formData, setFormData] = useState({
    departmentCode: '',
    departmentName: '',
    grossSalary: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentAPI.getAll();
      setDepartments(data);
    } catch (error) {
      addMessage('error', error.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await departmentAPI.create(formData);
      addMessage('success', 'Department added successfully');

      // Reset form
      setFormData({
        departmentCode: '',
        departmentName: '',
        grossSalary: '',
      });

      // Refresh department list
      fetchDepartments();
    } catch (error) {
      addMessage('error', error.message || 'Failed to add department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Department Management</h1>
      </div>

      <div className="form-container mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiPlus className="mr-2" /> Add New Department
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Department Code"
              name="departmentCode"
              value={formData.departmentCode}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Department Name"
              name="departmentName"
              value={formData.departmentName}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Gross Salary"
              name="grossSalary"
              type="number"
              value={formData.grossSalary}
              onChange={handleChange}
              required
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Add Department'}
            </button>
          </div>
        </form>
      </div>

      <div className="table-container">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiBriefcase className="mr-2" /> Department List
        </h2>

        {loading && departments.length === 0 ? (
          <div className="py-8 text-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department Code</th>
                  <th>Department Name</th>
                  <th>Gross Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {departments.length > 0 ? (
                  departments.map((department) => (
                    <tr key={department.departmentCode}>
                      <td>{department.departmentCode}</td>
                      <td>{department.departmentName}</td>
                      <td>{formatCurrency(department.grossSalary)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-4">
                      No departments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentPage;
