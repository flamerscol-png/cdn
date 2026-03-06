const axios = require('axios');

async function test() {
    const key = 'WCTDX3-LDS6YS-AVRJBJ-M1EFBV';
    const payload = {
        amount: "1.00",
        currency: "USD",
        lifetime: 60,
        callback_url: 'https://flamercoal-backend.onrender.com/api/payments/callback',
        return_url: 'https://flamercoal.web.app/success',
        description: 'Test',
        order_id: 'test_123',
        email: 'test@example.com'
    };

    try {
        const resp = await axios.post('https://api.oxapay.com/v1/payment/invoice', payload, {
            headers: { 'merchant_api_key': key }
        });
        console.log('OXAPAY V1 RESPONSE:', JSON.stringify(resp.data, null, 2));
    } catch (err) {
        console.error('OXAPAY ERROR:', err.response ? err.response.data : err.message);
    }
}

test();
