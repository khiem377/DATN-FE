import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Spin } from 'antd';
import AuthPage from './AuthPageContent';
export default function AuthPageWrapper() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Đang tải...</div>}>
      <AuthPage />
    </Suspense>
  );
}