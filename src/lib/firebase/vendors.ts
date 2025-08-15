import { db } from './config';
import { ref, set, get, onValue, remove, push, update } from 'firebase/database';
import { Vendor, VendorFormData } from '@/types/vendor';

export const addVendor = async (uid: string, vendorData: VendorFormData) => {
  // Validate required fields
  if (!vendorData.name || !vendorData.serviceType || !vendorData.contactNumber || !vendorData.packageName || !vendorData.contractPrice) {
    throw new Error('Missing required fields');
  }

  // Validate contact number format (Philippine mobile number)
  const contactRegex = /^(09|\+639)\d{9}$/;
  if (!contactRegex.test(vendorData.contactNumber)) {
    throw new Error('Invalid contact number format');
  }

  // Validate email format if provided
  if (vendorData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorData.email)) {
    throw new Error('Invalid email format');
  }

  // Use timestamp-based ID (restore original behavior)
  const id = Date.now().toString();
  const vendorRef = ref(db, `vendors/${uid}/${id}`);

  // Save the vendor with timestamp-based ID
  await set(vendorRef, {
    id,
    name: vendorData.name,
    serviceType: vendorData.serviceType,
    contactNumber: vendorData.contactNumber,
    email: vendorData.email || '',
    packageName: vendorData.packageName,
    contractPrice: vendorData.contractPrice,
    amountPaid: 0,
    contactInfo: vendorData.contactNumber, // For backward compatibility
  });

  return id;
};

export const updateVendor = async (uid: string, vendorId: string, vendorData: Partial<VendorFormData>) => {
  const vendorRef = ref(db, `vendors/${uid}/${vendorId}`);
  await update(vendorRef, {
    ...vendorData,
    id: vendorId, // Preserve the ID
  });
};

export const deleteVendor = async (uid: string, vendorId: string) => {
  const vendorRef = ref(db, `vendors/${uid}/${vendorId}`);
  await remove(vendorRef);
};

export const getVendors = (uid: string, callback: (vendors: Vendor[]) => void) => {
  const vendorsRef = ref(db, `vendors/${uid}`);
  return onValue(vendorsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const vendors: Vendor[] = Object.entries(data).map(([id, vendor]: [string, any]) => ({
      id,
      name: vendor.name || '',
      serviceType: vendor.serviceType || '',
      contactNumber: vendor.contactNumber || '',
      email: vendor.email || '',
      packageName: vendor.packageName || '',
      contractPrice: typeof vendor.contractPrice === 'number' ? vendor.contractPrice : 0,
      amountPaid: typeof vendor.amountPaid === 'number' ? vendor.amountPaid : 0,
      contactInfo: vendor.contactInfo || vendor.contactNumber || '',
      notes: vendor.notes || ''
    }));

    callback(vendors.sort((a, b) => a.name.localeCompare(b.name)));
  });
};

export const getServiceTypes = (uid: string, callback: (serviceTypes: string[]) => void) => {
  const accommodationsRef = ref(db, `setup/${uid}/accommodations`);
  return onValue(accommodationsRef, (snapshot) => {
    const data = snapshot.val();
    // Handle both array and object formats for backward compatibility
    const serviceTypes = data 
      ? Array.isArray(data)
        ? data // Already an array
        : Object.keys(data).length > 0 
          ? Object.keys(data) // Old format: object with keys
          : [] // Empty object
      : []; // No data
    callback(serviceTypes);
  });
};

export const getBudgetExpenses = (uid: string, callback: (expenses: any[]) => void) => {
  const expensesRef = ref(db, `budgetExpenses/${uid}`);
  return onValue(expensesRef, (snapshot) => {
    const data = snapshot.val();
    const expenses = data ? Object.values(data) : [];
    callback(expenses);
  });
};

// Selected Vendors
export const getSelectedVendors = (uid: string, callback: (selectedVendors: Record<string, string[]>) => void) => {
  const selectedVendorsRef = ref(db, `selectedVendors/${uid}`);
  
  return onValue(selectedVendorsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback({});
      return;
    }

    // Convert sanitized keys back to original format for the UI
    const desanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
      const originalKey = key.replace(/-/g, '/');
      // Handle both old (string) and new (array) formats for backward compatibility
      if (typeof value === 'string') {
        acc[originalKey] = [value];
      } else if (Array.isArray(value)) {
        acc[originalKey] = value;
      } else {
        acc[originalKey] = [];
      }
      return acc;
    }, {} as Record<string, string[]>);

    callback(desanitizedData);
  });
};

export const selectVendor = async (uid: string, serviceType: string, vendorId: string) => {
  const sanitizedType = serviceType.replace(/\//g, '-');
  const selectedVendorRef = ref(db, `selectedVendors/${uid}/${sanitizedType}`);
  
  // Get current selected vendors for this service type
  const snapshot = await get(selectedVendorRef);
  const currentData = snapshot.val();
  
  let updatedVendors: string[];
  
  if (!currentData) {
    // No vendors selected yet
    updatedVendors = [vendorId];
  } else if (typeof currentData === 'string') {
    // Old format (single vendor), convert to array
    updatedVendors = currentData === vendorId ? [] : [currentData, vendorId];
  } else if (Array.isArray(currentData)) {
    // New format (array), toggle vendor
    if (currentData.includes(vendorId)) {
      updatedVendors = currentData.filter(id => id !== vendorId);
    } else {
      updatedVendors = [...currentData, vendorId];
    }
  } else {
    updatedVendors = [vendorId];
  }
  
  if (updatedVendors.length === 0) {
    await remove(selectedVendorRef);
  } else {
    await set(selectedVendorRef, updatedVendors);
  }
};

export const unselectVendor = async (uid: string, serviceType: string, vendorId?: string) => {
  const sanitizedType = serviceType.replace(/\//g, '-');
  const selectedVendorRef = ref(db, `selectedVendors/${uid}/${sanitizedType}`);
  
  if (!vendorId) {
    // Remove all vendors for this service type
    await remove(selectedVendorRef);
  } else {
    // Remove specific vendor
    const snapshot = await get(selectedVendorRef);
    const currentData = snapshot.val();
    
    if (Array.isArray(currentData)) {
      const updatedVendors = currentData.filter(id => id !== vendorId);
      if (updatedVendors.length === 0) {
        await remove(selectedVendorRef);
      } else {
        await set(selectedVendorRef, updatedVendors);
      }
    } else if (currentData === vendorId) {
      await remove(selectedVendorRef);
    }
  }
};

// Migration function to convert push-generated keys to timestamp-based keys
export const migrateVendorKeys = async (uid: string) => {
  const vendorsRef = ref(db, `vendors/${uid}`);
  
  try {
    // Get all vendors for this user
    const snapshot = await get(vendorsRef);
    const vendors = snapshot.val() as Record<string, Vendor>;
    
    if (!vendors) return;

    // Track migration stats
    const stats = {
      total: Object.keys(vendors).length,
      migrated: 0,
      skipped: 0,
      errors: 0
    };

    // Process each vendor
    for (const [oldKey, vendor] of Object.entries(vendors)) {
      try {
        // Skip if already using timestamp key (starts with a number)
        if (/^\d+$/.test(oldKey)) {
          stats.skipped++;
          continue;
        }

        // Generate new timestamp-based key
        const newKey = Date.now().toString();
        
        // Create new entry with timestamp key
        await set(ref(db, `vendors/${uid}/${newKey}`), {
          ...vendor,
          id: newKey // Update the ID field to match the new key
        } as Vendor);

        // Delete old entry
        await remove(ref(db, `vendors/${uid}/${oldKey}`));

        stats.migrated++;
        
        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Error migrating vendor ${oldKey}:`, error);
        stats.errors++;
      }
    }

    console.log('Migration completed:', stats);
    return stats;
  } catch (error) {
    console.error('Migration failed:', error);
    throw new Error('Failed to migrate vendor keys');
  }
}; 