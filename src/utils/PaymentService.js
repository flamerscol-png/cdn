import { recordCryptoPayment } from './db';
import API_BASE_URL from './api';

/**
 * Payment Service
 * Handles secure payment processing via Oxapay.
 */
class PaymentService {
    /**
     * Creates a NOWPayments invoice for a specific plan.
     * Redirects the user to the secure checkout page.
     */
    static async createNOWPaymentsInvoice(userId, tier, userEmail) {
        console.log(`[Payment] Creating NOWPayments invoice for ${userId} [${tier.name}]`);

        try {
            const response = await fetch(`${API_BASE_URL}/api/payments/create-invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: tier.price.replace('$', ''),
                    currency: 'usd',
                    description: `FlamerCoal: ${tier.name} (${tier.powers})`,
                    userId: userId,
                    email: userEmail || ''
                })
            });

            const data = await response.json();
            if (data.success && data.payUrl) {
                // Redirect user to the secure NOWPayments checkout
                window.location.href = data.payUrl;
                return { success: true };
            } else {
                throw new Error(data.details || 'Failed to initialize NOWPayments checkout');
            }
        } catch (error) {
            console.error('[Payment] FATAL Error creating invoice:', error);
            console.error('[Payment] Stack Trace:', error.stack);
            throw error;
        }
    }

    /**
     * Records a Non-KYC crypto payment (Legacy support or manual tracking).
     */
    static async recordCryptoTransaction(userId, paymentData) {
        console.log(`[Payment] Recording crypto TxHash: ${paymentData.txHash}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return await recordCryptoPayment(userId, paymentData);
    }
}

export default PaymentService;
