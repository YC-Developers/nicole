import React, { useState, useEffect, useContext } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { salaryAPI, employeeAPI } from '../api/api';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { formatCurrency, getMonths, generateYears, getCurrentMonthYear } from '../utils/formatters';
import { MessageContext } from '../App';

const SalaryPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSalaryId, setCurrentSalaryId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState(null);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const { addMessage } = useContext(MessageContext);

  const [formData, setFormData] = useState({
    employeeNumber: '',
    grossSalary: '',
    totalDeduction: '',
    netSalary: '',
    month: currentMonth,
    year: currentYear,
  });

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
  }, []);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const data = await salaryAPI.getAll();
      setSalaries(data);
    } catch (error) {
      addMessage('error', error.message || 'Failed to fetch salaries');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeAPI.getAll();
      setEmployees(data);
    } catch (error) {
      addMessage('error', error.message || 'Failed to fetch employees');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };

      // Auto-calculate net salary
      if (name === 'grossSalary' || name === 'totalDeduction') {
        const grossSalary = parseFloat(name === 'grossSalary' ? value : prev.grossSalary) || 0;
        const totalDeduction = parseFloat(name === 'totalDeduction' ? value : prev.totalDeduction) || 0;
        updatedData.netSalary = (grossSalary - totalDeduction).toFixed(2);
      }

      return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (editMode) {
        await salaryAPI.update(currentSalaryId, formData);
        addMessage('success', 'Salary record updated successfully');
      } else {
        await salaryAPI.create(formData);
        addMessage('success', 'Salary record added successfully');
      }

      resetForm();
      fetchSalaries();
    } catch (error) {
      addMessage('error', error.message || `Failed to ${editMode ? 'update' : 'add'} salary record`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (salary) => {
    setFormData({
      employeeNumber: salary.employeeId || salary.employeeNumber,
      grossSalary: salary.grossSalary,
      totalDeduction: salary.totalDeduction,
      netSalary: salary.netSalary,
      month: salary.month,
      year: salary.year || new Date().getFullYear(),
    });
    setCurrentSalaryId(salary.id || salary.salaryId);
    setEditMode(true);
  };

  const confirmDelete = (salary) => {
    // Use id if available, otherwise use salaryId
    const salaryId = salary.id || salary.salaryId;
    setSalaryToDelete(salaryId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await salaryAPI.delete(salaryToDelete);
      addMessage('success', 'Salary record deleted successfully');
      fetchSalaries();
      setShowDeleteModal(false);
    } catch (error) {
      addMessage('error', error.message || 'Failed to delete salary record');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeNumber: '',
      grossSalary: '',
      totalDeduction: '',
      netSalary: '',
      month: currentMonth,
      year: currentYear,
    });
    setCurrentSalaryId(null);
    setEditMode(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Salary Management</h1>
      </div>

      <div className="form-container mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          {editMode ? (
            <>
              <FiEdit2 className="mr-2" /> Edit Salary Record
            </>
          ) : (
            <>
              <FiPlus className="mr-2" /> Add New Salary Record
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Employee"
              name="employeeNumber"
              type="select"
              value={formData.employeeNumber}
              onChange={handleChange}
              required
              disabled={editMode}
              options={employees.map((employee) => ({
                value: employee.employeeNumber,
                label: `${employee.firstName} ${employee.lastName} (${employee.employeeNumber})`,
              }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Month"
                name="month"
                type="select"
                value={formData.month}
                onChange={handleChange}
                required
                options={getMonths().map((month) => ({
                  value: month,
                  label: month,
                }))}
              />

              <FormInput
                label="Year"
                name="year"
                type="select"
                value={formData.year}
                onChange={handleChange}
                required
                options={generateYears().map((year) => ({
                  value: year,
                  label: year.toString(),
                }))}
              />
            </div>

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

            <FormInput
              label="Total Deduction"
              name="totalDeduction"
              type="number"
              value={formData.totalDeduction}
              onChange={handleChange}
              required
              placeholder="0.00"
              step="0.01"
              min="0"
            />

            <FormInput
              label="Net Salary"
              name="netSalary"
              type="number"
              value={formData.netSalary}
              onChange={handleChange}
              required
              disabled
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : editMode ? (
                'Update Salary'
              ) : (
                'Add Salary'
              )}
            </button>

            {editMode && (
              <button
                type="button"
                onClick={resetForm}
                className="btn bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-container">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiDollarSign className="mr-2" /> Salary Records
        </h2>

        {loading && salaries.length === 0 ? (
          <div className="py-8 text-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Month/Year</th>
                  <th>Gross Salary</th>
                  <th>Deduction</th>
                  <th>Net Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salaries.length > 0 ? (
                  salaries.map((salary) => (
                    <tr key={salary.id || salary.salaryId}>
                      <td>{`${salary.firstName} ${salary.lastName}`}</td>
                      <td>{`${salary.month} ${salary.year || ''}`}</td>
                      <td>{formatCurrency(salary.grossSalary)}</td>
                      <td>{formatCurrency(salary.totalDeduction)}</td>
                      <td>{formatCurrency(salary.netSalary)}</td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(salary)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => confirmDelete(salary)}
                            className="p-1 text-danger hover:text-red-800"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No salary records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
        size="small"
      >
        <div className="p-4">
          <p className="mb-4">Are you sure you want to delete this salary record? This action cannot be undone.</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="small" /> : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalaryPage;
