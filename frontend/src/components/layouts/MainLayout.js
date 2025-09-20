import React from 'react';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">Header</header>
      <main className="p-4">{children}</main>
      <footer className="bg-gray-800 text-white p-4">Footer</footer>
    </div>
  );
};

export default MainLayout;