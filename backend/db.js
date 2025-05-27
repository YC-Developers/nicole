const mysql = require('mysql2');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'epms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('MySQL Configuration:');
console.log(`- Host: ${dbConfig.host}`);
console.log(`- User: ${dbConfig.user}`);
console.log(`- Database: ${dbConfig.database}`);

// Create a connection to check if MySQL is running
const checkConnection = () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 10000 // 10 seconds
    });

    connection.connect((err) => {
      if (err) {
        console.error('MySQL Connection Error:');
        if (err.code === 'ECONNREFUSED') {
          console.error('Connection refused. Please check if MySQL server is running.');
          console.error('If MySQL is not installed, please install it first.');
          console.error('Installation instructions:');
          console.error('1. Download MySQL from https://dev.mysql.com/downloads/');
          console.error('2. Install MySQL and set up a root user');
          console.error('3. Start the MySQL service');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
          console.error('Access denied. Please check your MySQL username and password.');
        } else {
          console.error(`Error details: ${err.message}`);
        }
        reject(err);
        return;
      }

      console.log('MySQL connection successful!');
      connection.end();
      resolve();
    });
  });
};

// Create database and tables
const initializeDatabase = async () => {
  try {
    // Check if MySQL is running
    await checkConnection();

    // Create a temporary connection to create the database
    const tempConnection = mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    // Create database if it doesn't exist
    await new Promise((resolve, reject) => {
      tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(`Database '${dbConfig.database}' created or already exists`);
        resolve();
      });
    });

    tempConnection.end();

    // Create a connection pool with the database
    const pool = mysql.createPool(dbConfig);
    const promisePool = pool.promise();

    // Create tables in the correct order to avoid foreign key issues

    // First, create tables without foreign keys
    console.log('Creating employee table...');
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS employee (
        employeeNumber VARCHAR(20) PRIMARY KEY,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        position VARCHAR(50) NOT NULL,
        address VARCHAR(255) NOT NULL,
        telephone VARCHAR(20) NOT NULL,
        gender ENUM('Male', 'Female', 'Other') NOT NULL,
        hiredDate DATE NOT NULL
      )
    `);

    console.log('Creating department table...');
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS department (
        departmentCode VARCHAR(20) PRIMARY KEY,
        departmentName VARCHAR(100) NOT NULL,
        grossSalary DECIMAL(10, 2) NOT NULL
      )
    `);

    console.log('Creating user table...');
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS user (
        userId INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Then create tables with foreign keys
    console.log('Creating salary table...');
    await promisePool.query(`
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

    console.log('Creating employee_department table...');
    try {
      await promisePool.query(`
        CREATE TABLE IF NOT EXISTS employee_department (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employeeNumber VARCHAR(20) NOT NULL,
          departmentCode VARCHAR(20) NOT NULL,
          assignedDate DATE NOT NULL,
          FOREIGN KEY (employeeNumber) REFERENCES employee(employeeNumber) ON DELETE CASCADE,
          FOREIGN KEY (departmentCode) REFERENCES department(departmentCode) ON DELETE CASCADE,
          UNIQUE KEY unique_employee_department (employeeNumber, departmentCode)
        )
      `);
    } catch (err) {
      console.error('Error creating employee_department table:', err.message);
      console.log('Creating simplified employee_department table without foreign keys...');

      // Create a simplified version without foreign keys
      await promisePool.query(`
        CREATE TABLE IF NOT EXISTS employee_department (
          id INT AUTO_INCREMENT PRIMARY KEY,
          employeeNumber VARCHAR(20) NOT NULL,
          departmentCode VARCHAR(20) NOT NULL,
          assignedDate DATE NOT NULL,
          UNIQUE KEY unique_employee_department (employeeNumber, departmentCode)
        )
      `);
    }

    console.log('All tables created successfully');
    return pool.promise();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Create a connection pool for immediate use
const pool = mysql.createPool(dbConfig);

// Initialize database in the background
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    console.log('Server will continue running, but database operations may fail');
  });

// Export the database connection
module.exports = {
  getConnection: () => {
    return pool.promise();
  }
};
