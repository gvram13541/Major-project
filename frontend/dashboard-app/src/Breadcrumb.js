import React from 'react';
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react';
import './App.css';

const Breadcrumb = () => {
  return (
    <CBreadcrumb className="breadcrumb-container" style={{ paddingLeft: "30px" }}>
      <CBreadcrumbItem href="#">Home</CBreadcrumbItem>
      <CBreadcrumbItem href="#">Dashboards</CBreadcrumbItem>
      <CBreadcrumbItem active>Current Page</CBreadcrumbItem>
    </CBreadcrumb>
  );
};

export default Breadcrumb;