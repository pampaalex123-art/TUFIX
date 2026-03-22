import { Worker } from '../types';

/**
 * This function simulates sending worker data to a backend endpoint
 * when a worker first signs up. The backend would then add a new row
 * to the Google Sheet.
 * 
 * In a real application, this would be an API call, e.g., using fetch:
 * await fetch('/api/spreadsheet/workers', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(payload),
 * });
 * 
 * @param worker The newly created worker object.
 */
export const addWorkerToSpreadsheet = async (worker: Worker): Promise<void> => {
  // Map the worker data to match the spreadsheet headers for a new entry.
  const payload = {
    worker_id: worker.id,
    name: worker.name,
    email: worker.email,
    phone_number: `${worker.phoneNumber.code} ${worker.phoneNumber.number}`,
    id_number: worker.idNumber,
    location: worker.location,
    service_category: worker.service,
    signup_date: worker.signupDate,
    verification_status: 'pending',
    // These fields will be empty until an admin takes action
    id_photo_url: '',
    selfie_photo_url: '',
    approval_date: '',
    admin_approver: '',
  };

  console.log("--- SPREADSHEET ADD ROW ---");
  console.log("Simulating API call to add a new worker row to Google Sheet:");
  console.log(payload);
  console.log("--------------------------");

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, you would handle success or error responses here.
  return;
};

/**
 * This function simulates sending verification data to a backend endpoint
 * when an admin approves or declines a worker. The backend would find the
 * corresponding row by worker_id and update it.
 * 
 * In a real application, this would be an API call, e.g., using fetch:
 * await fetch(`/api/spreadsheet/workers/${worker.id}`, {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(payload),
 * });
 * 
 * @param worker The worker object after an admin action (approval/decline).
 */
export const updateSpreadsheetVerificationStatus = async (worker: Worker): Promise<void> => {
  // Map the updated data to the relevant spreadsheet headers.
  const payload = {
    worker_id: worker.id, // Key to find the row
    id_photo_url: worker.idPhotoUrl,
    selfie_photo_url: worker.selfiePhotoUrl,
    verification_status: worker.verificationStatus,
    // This field is used for both the approval and decline date.
    approval_date: worker.approvalDate, 
    admin_approver: worker.adminApproverId,
  };

  console.log("--- SPREADSHEET UPDATE ROW ---");
  console.log("Simulating API call to update a worker row in Google Sheet:");
  console.log(payload);
  console.log("----------------------------");

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In a real app, you would handle success or error responses here.
  return;
};
