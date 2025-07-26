'use client';
import React, { Suspense } from 'react';
import SearchContent from './SearchContent';
import { Spin } from 'antd';  

const SearchPage = () => {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" /></div>}>
      <SearchContent />
    </Suspense>
  );
};

export default SearchPage;
