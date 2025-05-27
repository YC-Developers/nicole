import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Table, Alert } from 'react-bootstrap';
import axios from 'axios';

const EmployeeForm = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    position: '',
    address: '',
    telephone: '',
    gender: '',
    hiredDate: '',
    departmentCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      setError('Failed to fetch employees');
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Format the date to YYYY-MM-DD
      const formattedData = {
        ...formData,
        hiredDate: new Date(formData.hiredDate).toISOString().split('T')[0]
      };

      // Add employee
      await axios.post('/api/employees', formattedData);
      
      // If department is selected, assign employee to department
      if (formData.departmentCode) {
        await axios.post('/api/employee-department', {
          employeeNumber: formData.employeeNumber,
          departmentCode: formData.departmentCode,
          assignedDate: new Date().toISOString().split('T')[0]
        });
      }
      
      setSuccess('Employee added successfully');
      setFormData({
        employeeNumber: '',
        firstName: '',
        lastName: '',
        position: '',
        address: '',
        telephone: '',
        gender: '',
        hiredDate: '',
        departmentCode: ''
      });
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add employee');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Employee Management</h2>
      
      <Card className="form-container mb-4">
        <Card.Body>
          <Card.Title>Add New Employee</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="employeeNumber">
              <Form.Label className="required-field">Employee Number</Form.Label>
              <Form.Control
                type="text"
                name="employeeNumber"
                value={formData.employeeNumber}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3" controlId="firstName">
                  <Form.Label className="required-field">First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3" controlId="lastName">
                  <Form.Label className="required-field">Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3" controlId="position">
              <Form.Label className="required-field">Position</Form.Label>
              <Form.Control
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="address">
              <Form.Label className="required-field">Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="telephone">
              <Form.Label className="required-field">Telephone</Form.Label>
              <Form.Control
                type="text"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3" controlId="gender">
                  <Form.Label className="required-field">Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3" controlId="hiredDate">
                  <Form.Label className="required-field">Hired Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="hiredDate"
                    value={formData.hiredDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3" controlId="departmentCode">
              <Form.Label>Department</Form.Label>
              <Form.Select
                name="departmentCode"
                value={formData.departmentCode}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.departmentCode} value={dept.departmentCode}>
                    {dept.departmentName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Employee'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <div className="table-container">
        <h3 className="mb-3">Employee List</h3>
        <Table striped bordered hover responsive>
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
          <tbody>
            {employees.length > 0 ? (
              employees.map(employee => (
                <tr key={employee.employeeNumber}>
                  <td>{employee.employeeNumber}</td>
                  <td>{`${employee.firstName} ${employee.lastName}`}</td>
                  <td>{employee.position}</td>
                  <td>{employee.gender}</td>
                  <td>{employee.telephone}</td>
                  <td>{new Date(employee.hiredDate).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No employees found</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeeForm;
