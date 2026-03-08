import { ref, set, get, child, update, onValue } from "firebase/database";
import { database } from "../firebase";

// ============================================
// TIMEOUT WRAPPER - prevents hanging forever
// if Database URL is wrong or DB is unreachable
// ============================================
const withTimeout = (promise, timeoutMs = 8000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(
                "Database operation timed out. Your Firebase Realtime Database URL may be incorrect. " +
                "Go to Firebase Console → Realtime Database to find the correct URL."
            )), timeoutMs)
        )
    ]);
};

// ============================================
// GET USER PROFILE
// ============================================
export const getUserProfile = async (userId) => {
    try {
        console.log(`[DB] Fetching profile for: ${userId}`);
        const dbRef = ref(database);
        const snapshot = await withTimeout(get(child(dbRef, `users/${userId}`)));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log(`[DB] No profile exists for: ${userId}`);
            return null;
        }
    } catch (error) {
        console.error(`[DB] Error fetching user data for ${userId}:`, error.message);
        return null;
    }
};

// ============================================
// CREATE/UPDATE USER PROFILE (on login/signup)
// ============================================
export const createUserProfile = async (user) => {
    try {
        console.log(`[DB] Initializing profile for: ${user.uid}`);
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await withTimeout(get(userRef));

        if (!snapshot.exists()) {
            const userData = {
                email: user.email,
                displayName: user.displayName || "User",
                plan: "Free",
                planExpiry: null,
                powers: 100, // 100 🔥 Trial Balance for new users
                createdAt: Date.now(),
            };
            await withTimeout(set(userRef, userData));
            console.log(`[DB] ✅ Created profile for ${user.email} with 100 🔥`);
            return userData;
        }
        console.log(`[DB] ✅ Profile already exists for ${user.email}`);
        return snapshot.val();
    } catch (error) {
        console.error(`[DB] ❌ Profile Error for ${user.email}:`, error.message);
        return null;
    }
};

// ============================================
// ADD COAL (mining rewards, ad watching, etc.)
// ============================================
export const addPowers = async (userId, amount) => {
    try {
        console.log(`[DB] 🔥 Adding ${amount} Coal to user: ${userId}`);
        const userRef = ref(database, `users/${userId}`);

        // Step 1: Check if user exists
        const snapshot = await withTimeout(get(userRef), 6000);

        if (!snapshot.exists()) {
            // User doesn't have a profile yet - create one with the reward
            console.log(`[DB] User profile doesn't exist, creating with ${amount} Coal...`);
            await withTimeout(set(userRef, {
                powers: amount,
                createdAt: Date.now(),
                lastMiningAt: Date.now()
            }), 6000);
            console.log(`[DB] ✅ Created profile with ${amount} 🔥 Coal`);
            return amount;
        }

        // Step 2: User exists - update with new total
        const currentPowers = snapshot.val().powers || 0;
        const newTotal = currentPowers + amount;

        await withTimeout(update(userRef, {
            powers: newTotal,
            lastMiningAt: Date.now()
        }), 6000);

        console.log(`[DB] ✅ Coal updated: ${currentPowers} → ${newTotal} 🔥`);
        return newTotal;
    } catch (error) {
        console.error(`[DB] ❌ Error adding Coal:`, error.message);
        throw error;
    }
};

// ============================================
// UPDATE USER PLAN + ADD POWERS (after payment)
// ============================================
export const updateUserPlan = async (userId, planName, additionalPowers) => {
    try {
        console.log(`[DB] Upgrading ${userId} to ${planName} (+${additionalPowers} 🔥)`);
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await withTimeout(get(userRef));

        if (snapshot.exists()) {
            const currentPowers = snapshot.val().powers || 0;
            const updates = {
                plan: planName,
                powers: currentPowers + additionalPowers,
                lastUpgrade: Date.now()
            };
            await withTimeout(update(userRef, updates));
            console.log(`[DB] ✅ Upgrade success for ${userId}`);
            return updates;
        }
        return null;
    } catch (error) {
        console.error(`[DB] ❌ Error upgrading plan:`, error.message);
        throw error;
    }
};

// ============================================
// RECORD CRYPTO PAYMENT (Non-KYC)
// ============================================
export const recordCryptoPayment = async (userId, paymentData) => {
    try {
        console.log(`[DB] Recording pending crypto payment for ${userId}`);
        const paymentsRef = ref(database, `pending_payments/${userId}/${Date.now()}`);
        await withTimeout(set(paymentsRef, {
            ...paymentData,
            status: 'pending',
            submittedAt: Date.now()
        }));

        const userRef = ref(database, `users/${userId}`);
        await withTimeout(update(userRef, {
            paymentStatus: 'pending_verification'
        }));

        console.log(`[DB] ✅ Crypto payment registered: ${paymentData.txHash}`);
        return true;
    } catch (error) {
        console.error(`[DB] ❌ Error recording crypto payment:`, error.message);
        throw error;
    }
};

// ============================================
// DEDUCT COAL (tool gating)
// ============================================
export const deductPowers = async (userId, amount) => {
    try {
        console.log(`[DB] Deducting ${amount} 🔥 Coal from: ${userId}`);
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await withTimeout(get(userRef));

        if (snapshot.exists()) {
            const currentPowers = snapshot.val().powers || 0;
            if (currentPowers < amount) {
                throw new Error("Insufficient Coal Reserve (🔥)");
            }

            const newTotal = currentPowers - amount;
            await withTimeout(update(userRef, { powers: newTotal }));
            console.log(`[DB] ✅ Deduction success: ${newTotal} remaining`);
            return newTotal;
        }
        throw new Error("User profile not found");
    } catch (error) {
        console.error(`[DB] ❌ Error deducting Coal:`, error.message);
        throw error;
    }
};
