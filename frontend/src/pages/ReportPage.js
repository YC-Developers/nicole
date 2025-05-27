import React, { useState, useRef, useContext } from 'react';
import { FiFileText, FiPrinter } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import { reportAPI } from '../api/api';
import FormInput from '../components/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, getMonths, generateYears, getCurrentMonthYear } from '../utils/formatters';
import { MessageContext } from '../App';

const ReportPage = () => {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const { addMessage } = useContext(MessageContext);
  const [formData, setFormData] = useState({
    month: currentMonth,
    year: currentYear,
  });

  const reportRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Payroll_Report_${formData.month}_${formData.year}`,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const data = await reportAPI.getMonthlyReport(formData.month, formData.year);
      setReportData(data);
      setReportGenerated(true);
    } catch (error) {
      addMessage('error', error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return reportData.reduce((sum, record) => sum + parseFloat(record.netSalary), 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Monthly Payroll Report</h1>
      </div>

      <div className="form-container mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FiFileText className="mr-2" /> Generate Report
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Generate Report'}
            </button>
          </div>
        </form>
      </div>

      {reportGenerated && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8" ref={reportRef}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              Payroll Report: {formData.month} {formData.year}
            </h2>
            <button
              onClick={handlePrint}
              className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center"
            >
              <FiPrinter className="mr-2" /> Print Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee Name</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Net Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.length > 0 ? (
                  reportData.map((record, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{`${record.firstName} ${record.lastName}`}</td>
                      <td>{record.position}</td>
                      <td>{record.departmentName}</td>
                      <td>{formatCurrency(record.netSalary)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No data found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
              {reportData.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="text-right font-bold py-3 px-6">
                      Total:
                    </td>
                    <td className="font-bold py-3 px-6">
                      {formatCurrency(calculateTotal())}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>Report generated on: {new Date().toLocaleString()}</p>
          </div>

          {/* Signature Section - Only visible when printing */}
          <div className="signature-section print-only mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="signature-item">
                <div className="signature-line border-b border-gray-400 mb-2 h-12"></div>
                <p className="text-sm font-medium text-center">Prepared by</p>
                <p className="text-xs text-center text-gray-600">Date: ___________</p>
              </div>

              <div className="signature-item">
                <div className="signature-line border-b border-gray-400 mb-2 h-12"></div>
                <p className="text-sm font-medium text-center">Reviewed by</p>
                <p className="text-xs text-center text-gray-600">Date: ___________</p>
              </div>

              <div className="signature-item">
                <div className="signature-line border-b border-gray-400 mb-2 h-12"></div>
                <p className="text-sm font-medium text-center">Approved by</p>
                <p className="text-xs text-center text-gray-600">Date: ___________</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
