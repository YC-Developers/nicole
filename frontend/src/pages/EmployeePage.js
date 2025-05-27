import React, { useState, useEffect, useContext } from 'react';
import { FiPlus, FiUser } from 'react-icons/fi';
import { employeeAPI, departmentAPI, employeeDepartmentAPI } from '../api/api';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/formatters';
import { MessageContext } from '../App';

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addMessage } = useContext(MessageContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    position: '',
    address: '',
    telephone: '',
    gender: '',
    hiredDate: '',
    departmentCode: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeAPI.getAll();
      setEmployees(data);
    } catch (error) {
      addMessage('error', error.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentAPI.getAll();
      setDepartments(data);
    } catch (error) {
      addMessage('error', error.message || 'Failed to fetch departments');
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

      // Add employee
      const response = await employeeAPI.create(formData);
      const employeeNumber = response.employeeNumber;

      // If department is selected, assign employee to department
      if (formData.departmentCode && employeeNumber) {
        await employeeDepartmentAPI.assign({
          employeeNumber: employeeNumber,
          departmentCode: formData.departmentCode,
          assignedDate: new Date().toISOString().split('T')[0],
        });
      }

      addMessage('success', 'Employee added successfully');

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        position: '',
        address: '',
        telephone: '',
        gender: '',
        hiredDate: '',
        departmentCode: '',
      });

      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      addMessage('error', error.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employee Management</h1>
      </div>

      <div className="form-container mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiPlus className="mr-2" /> Add New Employee
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Gender"
              name="gender"
              type="select"
              value={formData.gender}
              onChange={handleChange}
              required
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
            />

            <FormInput
              label="Hired Date"
              name="hiredDate"
              type="date"
              value={formData.hiredDate}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Department"
              name="departmentCode"
              type="select"
              value={formData.departmentCode}
              onChange={handleChange}
              options={departments.map((dept) => ({
                value: dept.departmentCode,
                label: dept.departmentName,
              }))}
            />
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>

      <div className="table-container">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiUser className="mr-2" /> Employee List
        </h2>

        {loading && employees.length === 0 ? (
          <div className="py-8 text-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Number</th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Gender</th>
                  <th>Telephone</th>
                  <th>Hired Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr key={employee.employeeNumber}>
                      <td>{employee.employeeNumber}</td>
                      <td>{`${employee.firstName} ${employee.lastName}`}</td>
                      <td>{employee.position}</td>
                      <td>{employee.gender}</td>
                      <td>{employee.telephone}</td>
                      <td>{formatDate(employee.hiredDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No employees found
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

export default EmployeePage;
