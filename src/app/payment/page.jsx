import { Spin } from 'antd';
import CheckoutPageContent from './CheckoutPageContent';
import { Suspense } from 'react';

const CheckoutPage = () => {
    return (
        <Suspense fallback={
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px' 
            }}>
                <Spin size="large" />
            </div>
        }>
            <CheckoutPageContent />
        </Suspense>
    );
};

export default CheckoutPage;