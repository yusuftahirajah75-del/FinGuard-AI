import { v4 as uuidv4 } from 'uuid';

/**
 * Seedable Pseudo-Random Number Generator (Mulberry32)
 * Ensures 100% reproducible synthetic academic datasets.
 */
function createPRNG(seed = 123456789) {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHANNELS = ['ONLINE', 'MOBILE', 'ATM', 'POS', 'BRANCH'];
const TYPES = ['TRANSFER', 'PAYMENT', 'WITHDRAWAL'];
const CITIES = ['New York, US', 'London, UK', 'Frankfurt, DE', 'Singapore, SG', 'Toronto, CA', 'Tokyo, JP'];

/**
 * Generates approximately 1,000 realistic financial transactions with
 * injected statistical anomalies and separate ground-truth academic labels.
 * 
 * @param {Object} options - Generator options { count: 1000, seed: 42 }
 * @returns {Array<Object>} Array of transaction objects
 */
export function generateSyntheticTransactions(options = {}) {
  const count = options.count || 1000;
  const seed = options.seed || 424242;
  const rng = createPRNG(seed);

  const transactions = [];

  // Customer Profiles
  // 50 distinct customer personas
  const customers = [];
  for (let i = 1; i <= 50; i++) {
    const custId = `CUST-${String(i).padStart(4, '0')}`;
    const accountId = `ACC-${String(i).padStart(4, '0')}-01`;
    // Assign archetype
    let archetype = 'SALARIED';
    let baseMedian = 75;
    let baseSpread = 25;
    let habitualHours = [8, 21]; // 8 AM to 9 PM

    if (i <= 10) {
      archetype = 'BUSINESS';
      baseMedian = 1500;
      baseSpread = 600;
      habitualHours = [6, 23];
    } else if (i > 40) {
      archetype = 'SAVER';
      baseMedian = 40;
      baseSpread = 15;
      habitualHours = [10, 18];
    }

    // Default regular beneficiaries
    const beneficiaries = [
      `BEN-${String(i).padStart(3, '0')}-A`,
      `BEN-${String(i).padStart(3, '0')}-B`,
      `BEN-UTILITY-GLOBAL`,
      `BEN-GROCERY-RETAIL`,
    ];

    customers.push({
      customerReference: custId,
      sourceAccount: accountId,
      archetype,
      baseMedian,
      baseSpread,
      habitualHours,
      beneficiaries,
    });
  }

  // Base timestamp: 30 days ago to current
  const now = Date.now();
  const startTime = now - (30 * 24 * 60 * 60 * 1000);

  let txIndex = 1;

  // We allocate ~87% normal transactions, and ~13% explicit suspicious anomalies
  const suspiciousCount = Math.floor(count * 0.13);
  const normalCount = count - suspiciousCount;

  // 1. Generate Normal Transactions
  for (let i = 0; i < normalCount; i++) {
    const cust = customers[Math.floor(rng() * customers.length)];
    const timeOffset = Math.floor(rng() * (now - startTime));
    const txDate = new Date(startTime + timeOffset);

    // Pick habitual hour
    const [minH, maxH] = cust.habitualHours;
    const hour = minH + Math.floor(rng() * (maxH - minH + 1));
    txDate.setUTCHours(hour, Math.floor(rng() * 60), Math.floor(rng() * 60));

    // Normal amount around median with small variation
    const variation = (rng() - 0.5) * 2 * cust.baseSpread;
    const amount = Math.max(5.0, Number((cust.baseMedian + variation).toFixed(2)));

    // Beneficiary from habitual set
    const bene = cust.beneficiaries[Math.floor(rng() * cust.beneficiaries.length)];
    const channel = CHANNELS[Math.floor(rng() * CHANNELS.length)];
    const type = TYPES[Math.floor(rng() * TYPES.length)];
    const location = CITIES[Math.floor(rng() * CITIES.length)];

    transactions.push({
      id: uuidv4(),
      transaction_reference: `TXN-${String(txIndex++).padStart(7, '0')}`,
      customer_reference: cust.customerReference,
      source_account_reference: cust.sourceAccount,
      beneficiary_reference: bene,
      amount,
      currency: 'USD',
      transaction_type: type,
      transaction_channel: channel,
      transaction_location: location,
      transaction_timestamp: txDate.toISOString(),
      transaction_status: 'COMPLETED',
      synthetic_ground_truth_label: 'NORMAL',
    });
  }

  // 2. Generate Injected Anomalies (~130 transactions)
  // Types:
  // A. Extreme Amount Spike (~30)
  // B. Velocity Bursts (~30 in groups of 4-6)
  // C. Repeated Transactions (~30 in pairs/triples)
  // D. Off-hours Nocturnal Activity (~20)
  // E. Novel Offshore Beneficiary with high amount (~20)

  // A. Extreme Amount Spikes
  for (let i = 0; i < 30; i++) {
    // Pick salaried or saver customer
    const cust = customers[15 + (i % 25)];
    const timeOffset = Math.floor(rng() * (now - startTime));
    const txDate = new Date(startTime + timeOffset);

    // Massive spike: 20x to 80x median
    const extremeAmount = Number((cust.baseMedian * (20 + rng() * 60)).toFixed(2));
    const bene = `BEN-UNFAMILIAR-${Math.floor(1000 + rng() * 9000)}`;

    transactions.push({
      id: uuidv4(),
      transaction_reference: `TXN-${String(txIndex++).padStart(7, '0')}`,
      customer_reference: cust.customerReference,
      source_account_reference: cust.sourceAccount,
      beneficiary_reference: bene,
      amount: extremeAmount,
      currency: 'USD',
      transaction_type: 'TRANSFER',
      transaction_channel: 'ONLINE',
      transaction_location: 'Unknown Proxy / Foreign IP',
      transaction_timestamp: txDate.toISOString(),
      transaction_status: 'COMPLETED',
      synthetic_ground_truth_label: 'SUSPICIOUS',
    });
  }

  // B. Velocity Bursts (6 burst clusters of 5 rapid transactions)
  for (let burst = 0; burst < 6; burst++) {
    const cust = customers[burst * 4 + 2];
    const burstBaseTime = startTime + Math.floor(rng() * (now - startTime - 3600000));
    
    for (let step = 0; step < 5; step++) {
      // Occur 30 to 60 seconds apart
      const txTime = new Date(burstBaseTime + (step * 45 * 1000));
      transactions.push({
        id: uuidv4(),
        transaction_reference: `TXN-${String(txIndex++).padStart(7, '0')}`,
        customer_reference: cust.customerReference,
        source_account_reference: cust.sourceAccount,
        beneficiary_reference: `BEN-BURST-RECIPIENT-${burst}`,
        amount: Number((350 + rng() * 150).toFixed(2)),
        currency: 'USD',
        transaction_type: 'PAYMENT',
        transaction_channel: 'MOBILE',
        transaction_location: 'Miami, US',
        transaction_timestamp: txTime.toISOString(),
        transaction_status: 'COMPLETED',
        synthetic_ground_truth_label: 'SUSPICIOUS',
      });
    }
  }

  // C. Repeated Transactions (12 pairs of identical transfers 3 minutes apart)
  for (let rep = 0; rep < 12; rep++) {
    const cust = customers[10 + rep];
    const repBaseTime = startTime + Math.floor(rng() * (now - startTime - 3600000));
    const repAmount = Number((480.00 + rep * 15).toFixed(2));
    const targetBene = `BEN-REPEATED-TARGET-${rep}`;

    // First transaction
    transactions.push({
      id: uuidv4(),
      transaction_reference: `TXN-${String(txIndex++).padStart(7, '0')}`,
      customer_reference: cust.customerReference,
      source_account_reference: cust.sourceAccount,
      beneficiary_reference: targetBene,
      amount: repAmount,
      currency: 'USD',
      transaction_type: 'TRANSFER',
      transaction_channel: 'ONLINE',
      transaction_location: 'London, UK',
      transaction_timestamp: new Date(repBaseTime).toISOString(),
      transaction_status: 'COMPLETED',
      synthetic_ground_truth_label: 'NORMAL', // first one is baseline
    });

    // Second identical transaction 3 minutes later
    transactions.push({
      id: uuidv4(),
      transaction_reference: `TXN-${String(txIndex++).padStart(7, '0')}`,
      customer_reference: cust.customerReference,
      source_account_reference: cust.sourceAccount,
      beneficiary_reference: targetBene,
      amount: repAmount,
      currency: 'USD',
      transaction_type: 'TRANSFER',
      transaction_channel: 'ONLINE',
      transaction_location: 'London, UK',
      transaction_timestamp: new Date(repBaseTime + (3 * 60 * 1000)).toISOString(),
      transaction_status: 'COMPLETED',
      synthetic_ground_truth_label: 'SUSPICIOUS', // rapid duplicate is anomalous
    });
  }

  // D. Off-hours Nocturnal Activity
  for (let n = 0; n < 20; n++) {
    const cust = customers[25 + n]; // Daytime salaried individuals
    const timeOffset = Math.floor(rng() * (now - startTime));
    const txDate = new Date(startTime + timeOffset);
    // Set to 03:00 - 04:30 AM
    txDate.setUTCHours(3, Math.floor(rng() * 45), 0);

    transactions.push({
      id: uuidv4(),
      transaction_reference: `TXN-${String(txIndex++).padStart(7, '0')}`,
      customer_reference: cust.customerReference,
      source_account_reference: cust.sourceAccount,
      beneficiary_reference: `BEN-NOCTURNAL-${n}`,
      amount: Number((cust.baseMedian * (4 + rng() * 8)).toFixed(2)),
      currency: 'USD',
      transaction_type: 'TRANSFER',
      transaction_channel: 'ONLINE',
      transaction_location: 'Foreign Exit Node',
      transaction_timestamp: txDate.toISOString(),
      transaction_status: 'COMPLETED',
      synthetic_ground_truth_label: 'SUSPICIOUS',
    });
  }

  // E. Novel Offshore Beneficiary with high amount
  for (let o = 0; o < 20; o++) {
    const cust = customers[5 + o];
    const timeOffset = Math.floor(rng() * (now - startTime));
    const txDate = new Date(startTime + timeOffset);

    transactions.push({
      id: uuidv4(),
      transaction_reference: `TXN-${String(txIndex++).padStart(7, '0')}`,
      customer_reference: cust.customerReference,
      source_account_reference: cust.sourceAccount,
      beneficiary_reference: `BEN-OFFSHORE-CRYPTO-${o}`,
      amount: Number((cust.baseMedian * (12 + rng() * 20)).toFixed(2)),
      currency: 'USD',
      transaction_type: 'TRANSFER',
      transaction_channel: 'ONLINE',
      transaction_location: 'Panama City, PA',
      transaction_timestamp: txDate.toISOString(),
      transaction_status: 'COMPLETED',
      synthetic_ground_truth_label: 'SUSPICIOUS',
    });
  }

  // Sort chronological strictly ascending
  transactions.sort((a, b) => new Date(a.transaction_timestamp).getTime() - new Date(b.transaction_timestamp).getTime());

  return transactions;
}

export default generateSyntheticTransactions;
