import React, { useState } from 'react';
import { Form, Button, Card, Table, Alert } from 'react-bootstrap';
import axios from 'axios';

const Report = () => {
  const [reportData, setReportData] = useState([]);
  const [formData, setFormData] = useState({
    month: '',
    year: new Date().getFullYear()
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setReportGenerated(false);

    try {
      const response = await axios.get('/api/reports/monthly', {
        params: formData
      });

      setReportData(response.data);
      setReportGenerated(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <h2 className="mb-4">Monthly Payroll Report</h2>

      <Card className="form-container mb-4">
        <Card.Body>
          <Card.Title>Generate Report</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
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

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {reportGenerated && (
        <div className="report-container">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Payroll Report: {formData.month} {formData.year}</h3>
            <Button variant="outline-secondary" onClick={handlePrint}>
              Print Report
            </Button>
          </div>

          <Table striped bordered hover responsive className="mt-3">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Net Salary</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? (
                reportData.map((record, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{`${record.firstName} ${record.lastName}`}</td>
                    <td>{record.position}</td>
                    <td>{record.departmentName}</td>
                    <td>${parseFloat(record.netSalary).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">No data found for the selected period</td>
                </tr>
              )}
            </tbody>
            {reportData.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="4" className="text-end fw-bold">Total:</td>
                  <td className="fw-bold">
                    ${reportData.reduce((sum, record) => sum + parseFloat(record.netSalary), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </Table>

          {/* Signature Section - Only visible when printing */}
          <div className="signature-section print-only mt-5">
            <div className="row">
              <div className="col-md-4 text-center">
                <div className="signature-line border-bottom mb-2" style={{height: '50px'}}></div>
                <p className="small fw-bold">Prepared by</p>
                <p className="small text-muted">Date: ___________</p>
              </div>

              <div className="col-md-4 text-center">
                <div className="signature-line border-bottom mb-2" style={{height: '50px'}}></div>
                <p className="small fw-bold">Reviewed by</p>
                <p className="small text-muted">Date: ___________</p>
              </div>

              <div className="col-md-4 text-center">
                <div className="signature-line border-bottom mb-2" style={{height: '50px'}}></div>
                <p className="small fw-bold">Approved by</p>
                <p className="small text-muted">Date: ___________</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
