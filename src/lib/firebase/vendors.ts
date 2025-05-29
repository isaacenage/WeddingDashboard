import { db } from './config';
import { ref, set, get, onValue, remove, push, update } from 'firebase/database';
import { Vendor, VendorFormData } from '@/types/vendor';

export const addVendor = async (uid: string, vendorData: VendorFormData) => {
  const vendorRef = ref(db, `vendors/${uid}/${vendorData.name}`);
  await set(vendorRef, {
    ...vendorData,
    id: vendorData.name, // Using name as ID for easy lookup
  });
};

export const updateVendor = async (uid: string, vendorId: string, vendorData: Partial<VendorFormData>) => {
  const vendorRef = ref(db, `vendors/${uid}/${vendorId}`);
  await set(vendorRef, vendorData);
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
      serviceType: vendor.type || '', // Map 'type' to 'serviceType'
      contactNumber: vendor.contact || '', // Map 'contact' to 'contactNumber'
      email: vendor.email || '',
      packageName: vendor.package || '', // Map 'package' to 'packageName'
      contractPrice: Number(vendor.price || 0), // Map 'price' to 'contractPrice'
      amountPaid: Number(vendor.paid || 0), // Map 'paid' to 'amountPaid'
      contactInfo: vendor.contact || '', // Add contactInfo field
    }));

    callback(vendors);
  });
};

export const getServiceTypes = (uid: string, callback: (serviceTypes: string[]) => void) => {
  const accommodationsRef = ref(db, `setup/${uid}/accommodations`);
  return onValue(accommodationsRef, (snapshot) => {
    const data = snapshot.val();
    const serviceTypes: string[] = data ? Object.keys(data) : [];
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
export const getSelectedVendors = (uid: string, callback: (selectedVendors: Record<string, string>) => void) => {
  const selectedVendorsRef = ref(db, `selectedVendors/${uid}`);
  
  return onValue(selectedVendorsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback({});
      return;
    }

    // Convert sanitized keys back to original format for the UI
    const desanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key.replace(/-/g, '/')] = value as string;
      return acc;
    }, {} as Record<string, string>);

    callback(desanitizedData);
  });
};

export const selectVendor = async (uid: string, serviceType: string, vendorId: string) => {
  const sanitizedType = serviceType.replace(/\//g, '-');
  const selectedVendorRef = ref(db, `selectedVendors/${uid}/${sanitizedType}`);
  await set(selectedVendorRef, vendorId);
};

export const unselectVendor = async (uid: string, serviceType: string) => {
  const sanitizedType = serviceType.replace(/\//g, '-');
  const selectedVendorRef = ref(db, `selectedVendors/${uid}/${sanitizedType}`);
  await remove(selectedVendorRef);
}; 