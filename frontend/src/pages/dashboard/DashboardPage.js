import React from 'react';
import DashboardStats from '../../components/ui/DashboardStats';

const DashboardPage = () => {
  const stats = [
    { title: 'Users', value: 120 },
    { title: 'Orders', value: 45 },
    { title: 'Revenue', value: '$12,345' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <DashboardStats stats={stats} />
    </div>
  );
};

export default DashboardPage;