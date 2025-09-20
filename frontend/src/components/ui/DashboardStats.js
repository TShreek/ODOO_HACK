import React from 'react';

const DashboardStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="p-4 bg-white shadow rounded">
          <h3 className="text-lg font-bold">{stat.title}</h3>
          <p className="text-2xl">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;