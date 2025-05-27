const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import database module
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Function to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = require('net').createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
};

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'epms-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();

  }
  return res.status(401).json({ message: 'Unauthorized' });
};

// Routes

// Auth routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = db.getConnection();
    const [users] = await connection.query('SELECT * FROM user WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.userId;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      message: 'Login successful',
      user: {
        id: user.userId,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Employee routes
app.post('/api/employees', isAuthenticated, async (req, res) => {
  const { firstName, lastName, position, address, telephone, gender, hiredDate, departmentCode } = req.body;

  try {
    const connection = db.getConnection();

    // Check if employeeNumber is auto-increment
    const [employeeColumns] = await connection.query(`SHOW COLUMNS FROM employee WHERE Field = 'employeeNumber'`);
    const isAutoIncrement = employeeColumns[0]?.Extra?.includes('auto_increment') || false;

    let query, params;

    if (isAutoIncrement) {
      // If employeeNumber is auto-increment, don't include it in the INSERT
      query = 'INSERT INTO employee (firstName, lastName, position, address, telephone, gender, hiredDate, departmentCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      params = [firstName, lastName, position, address, telephone, gender, hiredDate, departmentCode || ''];
    } else {
      // If employeeNumber is not auto-increment, include it from the request body
      const { employeeNumber } = req.body;
      query = 'INSERT INTO employee (employeeNumber, firstName, lastName, position, address, telephone, gender, hiredDate, departmentCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      params = [employeeNumber, firstName, lastName, position, address, telephone, gender, hiredDate, departmentCode || ''];
    }

    console.log('Executing employee insert query:', query);
    console.log('Query parameters:', params);

    const [result] = await connection.query(query, params);

    // Get the inserted employee ID
    const employeeNumber = result.insertId;

    res.status(201).json({
      message: 'Employee added successfully',
      employeeNumber: employeeNumber
    });
  } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

app.get('/api/employees', isAuthenticated, async (_, res) => {
  try {
    const connection = db.getConnection();
    const [employees] = await connection.query('SELECT * FROM employee');
    res.json(employees);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Department routes
app.post('/api/departments', isAuthenticated, async (req, res) => {
  const { departmentCode, departmentName, grossSalary } = req.body;

  try {
    const connection = db.getConnection();
    await connection.query(
      'INSERT INTO department (departmentCode, departmentName, grossSalary) VALUES (?, ?, ?)',
      [departmentCode, departmentName, grossSalary]
    );

    res.status(201).json({ message: 'Department added successfully' });
  } catch (err) {
    console.error('Error adding department:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/departments', isAuthenticated, async (_, res) => {
  try {
    const connection = db.getConnection();
    const [departments] = await connection.query('SELECT * FROM department');
    res.json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Salary routes with CRUD operations
app.post('/api/salaries', isAuthenticated, async (req, res) => {
  const { employeeNumber, grossSalary, totalDeduction, netSalary, month, year } = req.body;

  try {
    const connection = db.getConnection();

    // Check the structure of the salary table
    const [salaryColumns] = await connection.query(`SHOW COLUMNS FROM salary`);

    // Determine the correct column names
    const salaryEmployeeIdField = salaryColumns.find(col => col.Field.toLowerCase().includes('employee'))?.Field || 'employeeId';
    const hasYearColumn = salaryColumns.some(col => col.Field.toLowerCase() === 'year');

    // Build the query dynamically based on the table structure
    let fields = [salaryEmployeeIdField, 'grossSalary', 'totalDeduction', 'netSalary', 'month'];
    let values = [employeeNumber, grossSalary, totalDeduction, netSalary, month];
    let placeholders = '?, ?, ?, ?, ?';

    if (hasYearColumn) {
      fields.push('year');
      values.push(year);
      placeholders += ', ?';
    }

    const query = `INSERT INTO salary (${fields.join(', ')}) VALUES (${placeholders})`;
    console.log('Executing insert query:', query);
    console.log('Query parameters:', values);

    await connection.query(query, values);

    res.status(201).json({ message: 'Salary record added successfully' });
  } catch (err) {
    console.error('Error adding salary record:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/salaries', isAuthenticated, async (_, res) => {
  try {
    const connection = db.getConnection();

    // First, check if the salary table exists and has the expected structure
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'salary'
    `);

    if (tables.length === 0) {
      return res.status(404).json({ message: 'Salary table not found' });
    }

    // Check the structure of the salary table
    const [salaryColumns] = await connection.query(`
      SHOW COLUMNS FROM salary
    `);

    // Check the structure of the employee table
    const [employeeColumns] = await connection.query(`
      SHOW COLUMNS FROM employee
    `);

    // Log the table structures for debugging
    console.log('Salary table structure:', salaryColumns.map(col => col.Field));
    console.log('Employee table structure:', employeeColumns.map(col => col.Field));

    // Determine the correct column names for joining
    const salaryEmployeeIdField = salaryColumns.find(col => col.Field.toLowerCase().includes('employee'))?.Field || 'employeeId';
    const employeePrimaryKeyField = employeeColumns.find(col => col.Key === 'PRI')?.Field || 'employeeNumber';

    console.log(`Joining salary.${salaryEmployeeIdField} with employee.${employeePrimaryKeyField}`);

    // Dynamically build the query based on the actual table structure
    const query = `
      SELECT salary.*, employee.firstName, employee.lastName, employee.position
      FROM salary
      JOIN employee ON salary.${salaryEmployeeIdField} = employee.${employeePrimaryKeyField}
    `;

    console.log('Executing query:', query);

    const [salaries] = await connection.query(query);
    res.json(salaries);
  } catch (err) {
    console.error('Error fetching salaries:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/salaries/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { grossSalary, totalDeduction, netSalary, month, year } = req.body;

  try {
    const connection = db.getConnection();

    // Check the structure of the salary table
    const [salaryColumns] = await connection.query(`SHOW COLUMNS FROM salary`);

    // Determine the primary key column name
    const primaryKeyField = salaryColumns.find(col => col.Key === 'PRI')?.Field || 'salaryId';
    const hasYearColumn = salaryColumns.some(col => col.Field.toLowerCase() === 'year');

    // Build the SET clause dynamically
    let setClause = 'grossSalary = ?, totalDeduction = ?, netSalary = ?, month = ?';
    let queryParams = [grossSalary, totalDeduction, netSalary, month];

    if (hasYearColumn) {
      setClause += ', year = ?';
      queryParams.push(year);
    }

    // Add the ID parameter
    queryParams.push(id);

    const query = `UPDATE salary SET ${setClause} WHERE ${primaryKeyField} = ?`;
    console.log('Executing update query:', query);
    console.log('Query parameters:', queryParams);

    await connection.query(query, queryParams);

    res.json({ message: 'Salary record updated successfully' });
  } catch (err) {
    console.error('Error updating salary record:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/salaries/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    const connection = db.getConnection();

    // Check the structure of the salary table
    const [salaryColumns] = await connection.query(`SHOW COLUMNS FROM salary`);

    // Determine the primary key column name
    const primaryKeyField = salaryColumns.find(col => col.Key === 'PRI')?.Field || 'salaryId';

    const query = `DELETE FROM salary WHERE ${primaryKeyField} = ?`;
    console.log('Executing delete query:', query);
    console.log('Query parameter:', id);

    await connection.query(query, [id]);

    res.json({ message: 'Salary record deleted successfully' });
  } catch (err) {
    console.error('Error deleting salary record:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Employee-Department assignment
app.post('/api/employee-department', isAuthenticated, async (req, res) => {
  const { employeeNumber, departmentCode, assignedDate } = req.body;

  try {
    const connection = db.getConnection();

    console.log('Assigning employee to department:', {
      employeeNumber,
      departmentCode,
      assignedDate
    });

    // Check if the employee exists
    const [employees] = await connection.query(
      'SELECT * FROM employee WHERE employeeNumber = ?',
      [employeeNumber]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if the department exists
    const [departments] = await connection.query(
      'SELECT * FROM department WHERE departmentCode = ?',
      [departmentCode]
    );

    if (departments.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Insert the assignment
    await connection.query(
      'INSERT INTO employee_department (employeeNumber, departmentCode, assignedDate) VALUES (?, ?, ?)',
      [employeeNumber, departmentCode, assignedDate]
    );

    res.status(201).json({ message: 'Employee assigned to department successfully' });
  } catch (err) {
    console.error('Error assigning employee to department:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Report route
app.get('/api/reports/monthly', isAuthenticated, async (req, res) => {
  const { month, year } = req.query;

  try {
    const connection = db.getConnection();

    // Check the structure of the tables to determine the correct column names
    const [salaryColumns] = await connection.query(`SHOW COLUMNS FROM salary`);
    const [employeeColumns] = await connection.query(`SHOW COLUMNS FROM employee`);

    // Determine the correct column names for joining
    const salaryEmployeeIdField = salaryColumns.find(col => col.Field.toLowerCase().includes('employee'))?.Field || 'employeeId';
    const employeePrimaryKeyField = employeeColumns.find(col => col.Key === 'PRI')?.Field || 'employeeNumber';

    // Check if salary table has a year column
    const hasYearColumn = salaryColumns.some(col => col.Field.toLowerCase() === 'year');

    // Build the WHERE clause based on available columns
    let whereClause = 'WHERE salary.month = ?';
    let queryParams = [month];

    if (hasYearColumn) {
      whereClause += ' AND salary.year = ?';
      queryParams.push(year);
    }

    // Use full table names and dynamic column names
    const query = `
      SELECT employee.firstName, employee.lastName, employee.position,
             department.departmentName, salary.netSalary, salary.month
             ${hasYearColumn ? ', salary.year' : ''}
      FROM salary
      JOIN employee ON salary.${salaryEmployeeIdField} = employee.${employeePrimaryKeyField}
      JOIN department ON employee.departmentCode = department.departmentCode
      ${whereClause}
    `;

    console.log('Executing report query:', query);
    console.log('Query parameters:', queryParams);

    const [report] = await connection.query(query, queryParams);

    res.json(report);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Function to ensure the salary table exists with the correct structure
const ensureSalaryTable = async () => {
  try {
    const connection = db.getConnection();

    // Check if the salary table exists
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'salary'
    `);

    if (tables.length === 0) {
      console.log('Salary table not found, creating it...');

      // Create the salary table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS salary (
          salaryId INT AUTO_INCREMENT PRIMARY KEY,
          employeeNumber VARCHAR(20) NOT NULL,
          grossSalary DECIMAL(10, 2) NOT NULL,
          totalDeduction DECIMAL(10, 2) NOT NULL,
          netSalary DECIMAL(10, 2) NOT NULL,
          month VARCHAR(20) NOT NULL,
          year INT NOT NULL,
          FOREIGN KEY (employeeNumber) REFERENCES employee(employeeNumber) ON DELETE CASCADE
        )
      `);

      console.log('Salary table created successfully');
    } else {
      console.log('Salary table exists');
    }
  } catch (err) {
    console.error('Error ensuring salary table:', err);
  }
};

// Create default admin user if none exists
const createDefaultAdmin = async () => {
  try {
    const connection = db.getConnection();
    const [users] = await connection.query('SELECT * FROM user WHERE role = "admin"');

    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO user (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('Default admin user created');
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('Error creating default admin: MySQL connection refused');
      console.error('Please make sure MySQL is installed and running');
    } else {
      console.error('Error creating default admin:', err);
    }
  }
};

// Start server with port fallback
const startServer = async () => {
  let currentPort = PORT;
  let maxAttempts = 5;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const inUse = await isPortInUse(currentPort);

    if (!inUse) {
      // Port is available, start the server
      const server = app.listen(currentPort, () => {
        console.log(`Server running on port ${currentPort}`);

        // Ensure database tables exist
        ensureSalaryTable().catch(err => {
          console.error('Failed to ensure salary table:', err.message);
        });

        // Try to create default admin, but don't stop server if it fails
        createDefaultAdmin().catch(err => {
          console.error('Failed to create default admin:', err.message);
          console.log('You can still use the API, but database operations will fail until MySQL is properly configured');
        });
      });

      // Handle server errors
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${currentPort} is already in use, trying another port...`);
          server.close();
          currentPort++;
          attempts++;
        } else {
          console.error('Server error:', err);
        }
      });

      break;
    } else {
      console.log(`Port ${currentPort} is already in use, trying port ${currentPort + 1}...`);
      currentPort++;
      attempts++;
    }
  }

  if (attempts >= maxAttempts) {
    console.error(`Could not find an available port after ${maxAttempts} attempts.`);
    process.exit(1);
  }
};

// Start the server
startServer();
