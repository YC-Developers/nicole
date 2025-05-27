import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">EPMS</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/employees" 
              active={location.pathname === '/employees' || location.pathname === '/'}
            >
              Employees
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/departments" 
              active={location.pathname === '/departments'}
            >
              Departments
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/salaries" 
              active={location.pathname === '/salaries'}
            >
              Salaries
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/reports" 
              active={location.pathname === '/reports'}
            >
              Reports
            </Nav.Link>
          </Nav>
          <Navbar.Text className="me-3">
            Signed in as: <span className="text-light">{user?.username}</span>
          </Navbar.Text>
          <Button variant="outline-light" onClick={onLogout}>Logout</Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
