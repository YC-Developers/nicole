import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Table, Alert } from 'react-bootstrap';
import axios from 'axios';

const DepartmentForm = () => {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    departmentCode: '',
    departmentName: '',
    grossSalary: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
    } catch (err) {
      setError('Failed to fetch departments');
      console.error(err);
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
      await axios.post('/api/departments', formData);
      setSuccess('Department added successfully');
      setFormData({
        departmentCode: '',
        departmentName: '',
        grossSalary: ''
      });
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add department');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Department Management</h2>
      
      <Card className="form-container mb-4">
        <Card.Body>
          <Card.Title>Add New Department</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="departmentCode">
              <Form.Label className="required-field">Department Code</Form.Label>
              <Form.Control
                type="text"
                name="departmentCode"
                value={formData.departmentCode}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="departmentName">
              <Form.Label className="required-field">Department Name</Form.Label>
              <Form.Control
                type="text"
                name="departmentName"
                value={formData.departmentName}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="grossSalary">
              <Form.Label className="required-field">Gross Salary</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                name="grossSalary"
                value={formData.grossSalary}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">
                Default gross salary for this department
              </Form.Text>
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Department'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <div className="table-container">
        <h3 className="mb-3">Department List</h3>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Department Code</th>
              <th>Department Name</th>
              <th>Gross Salary</th>
            </tr>
          </thead>
          <tbody>
            {departments.length > 0 ? (
              departments.map(department => (
                <tr key={department.departmentCode}>
                  <td>{department.departmentCode}</td>
                  <td>{department.departmentName}</td>
                  <td>${parseFloat(department.grossSalary).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">No departments found</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default DepartmentForm;
