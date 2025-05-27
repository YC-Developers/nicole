import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Table, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';

const SalaryForm = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeNumber: '',
    grossSalary: '',
    totalDeduction: '',
    netSalary: '',
    month: '',
    year: new Date().getFullYear()
  });
  const [editMode, setEditMode] = useState(false);
  const [currentSalaryId, setCurrentSalaryId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
  }, []);

  const fetchSalaries = async () => {
    try {
      const response = await axios.get('/api/salaries');
      setSalaries(response.data);
    } catch (err) {
      setError('Failed to fetch salaries');
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prevData => {
      const updatedData = {
        ...prevData,
        [name]: value
      };
      
      // Auto-calculate net salary when gross salary or deduction changes
      if (name === 'grossSalary' || name === 'totalDeduction') {
        const grossSalary = parseFloat(name === 'grossSalary' ? value : prevData.grossSalary) || 0;
        const totalDeduction = parseFloat(name === 'totalDeduction' ? value : prevData.totalDeduction) || 0;
        updatedData.netSalary = (grossSalary - totalDeduction).toFixed(2);
      }
      
      return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editMode) {
        await axios.put(`/api/salaries/${currentSalaryId}`, formData);
        setSuccess('Salary record updated successfully');
      } else {
        await axios.post('/api/salaries', formData);
        setSuccess('Salary record added successfully');
      }
      
      resetForm();
      fetchSalaries();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editMode ? 'update' : 'add'} salary record`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (salary) => {
    setFormData({
      employeeNumber: salary.employeeNumber,
      grossSalary: salary.grossSalary,
      totalDeduction: salary.totalDeduction,
      netSalary: salary.netSalary,
      month: salary.month,
      year: salary.year
    });
    setCurrentSalaryId(salary.salaryId);
    setEditMode(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/salaries/${salaryToDelete}`);
      setSuccess('Salary record deleted successfully');
      fetchSalaries();
      setShowDeleteModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete salary record');
      console.error(err);
    }
  };

  const confirmDelete = (salaryId) => {
    setSalaryToDelete(salaryId);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      employeeNumber: '',
      grossSalary: '',
      totalDeduction: '',
      netSalary: '',
      month: '',
      year: new Date().getFullYear()
    });
    setCurrentSalaryId(null);
    setEditMode(false);
  };

  return (
    <div>
      <h2 className="mb-4">Salary Management</h2>
      
      <Card className="form-container mb-4">
        <Card.Body>
          <Card.Title>{editMode ? 'Edit Salary Record' : 'Add New Salary Record'}</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="employeeNumber">
              <Form.Label className="required-field">Employee</Form.Label>
              <Form.Select
                name="employeeNumber"
                value={formData.employeeNumber}
                onChange={handleChange}
                required
                disabled={editMode}
              >
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.employeeNumber} value={employee.employeeNumber}>
                    {`${employee.firstName} ${employee.lastName} (${employee.employeeNumber})`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3" controlId="month">
                  <Form.Label className="required-field">Month</Form.Label>
                  <Form.Select
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Month</option>
                    {months.map((month, index) => (
                      <option key={index} value={month}>
                        {month}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3" controlId="year">
                  <Form.Label className="required-field">Year</Form.Label>
                  <Form.Control
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="2000"
                    max="2100"
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
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
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3" controlId="totalDeduction">
                  <Form.Label className="required-field">Total Deduction</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="totalDeduction"
                    value={formData.totalDeduction}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3" controlId="netSalary">
                  <Form.Label className="required-field">Net Salary</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="netSalary"
                    value={formData.netSalary}
                    onChange={handleChange}
                    readOnly
                    required
                  />
                  <Form.Text className="text-muted">
                    Auto-calculated (Gross - Deduction)
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Salary' : 'Add Salary')}
              </Button>
              {editMode && (
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      <div className="table-container">
        <h3 className="mb-3">Salary Records</h3>
        <Table striped bordered hover responsive>
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
          <tbody>
            {salaries.length > 0 ? (
              salaries.map(salary => (
                <tr key={salary.salaryId}>
                  <td>{`${salary.firstName} ${salary.lastName}`}</td>
                  <td>{`${salary.month} ${salary.year}`}</td>
                  <td>${parseFloat(salary.grossSalary).toFixed(2)}</td>
                  <td>${parseFloat(salary.totalDeduction).toFixed(2)}</td>
                  <td>${parseFloat(salary.netSalary).toFixed(2)}</td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleEdit(salary)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => confirmDelete(salary.salaryId)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No salary records found</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this salary record? This action cannot be undone.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SalaryForm;
