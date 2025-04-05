import React from 'react';
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react';
import { useLocation, Link } from 'react-router-dom';
import './App.css';

const Breadcrumb = () => {
  const location = useLocation();

  // Split the current path into segments
  const pathSegments = location.pathname.split('/').filter((segment) => segment);

  return (
    <CBreadcrumb className="breadcrumb-container" style={{ paddingLeft: "30px" }}>
      <CBreadcrumbItem>
        <Link to="/">Home</Link>
      </CBreadcrumbItem>
      {pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;

        return isLast ? (
          <CBreadcrumbItem key={path} active>
            {segment.charAt(0).toUpperCase() + segment.slice(1)}
          </CBreadcrumbItem>
        ) : (
          <CBreadcrumbItem key={path}>
            <Link to={path}>{segment.charAt(0).toUpperCase() + segment.slice(1)}</Link>
          </CBreadcrumbItem>
        );
      })}
    </CBreadcrumb>
  );
};

export default Breadcrumb;