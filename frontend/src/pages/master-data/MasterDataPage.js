import React from 'react';
import MasterDataForm from '../../components/forms/MasterDataForm';

const MasterDataPage = () => {
  const handleFormSubmit = (data) => {
    console.log('Form submitted:', data);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Master Data</h1>
      <MasterDataForm onSubmit={handleFormSubmit} />
    </div>
  );
};

export default MasterDataPage;