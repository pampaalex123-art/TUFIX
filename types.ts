// FIX: Replaced placeholder content with concrete type definitions.

export enum ServiceCategory {
  HANDYMAN = 'Handyman',
  ELECTRICIAN = 'Electrician',
  PLUMBER = 'Plumber',
  PAINTER = 'Painter',
  CARPENTER = 'Carpenter',
  CLEANER = 'Cleaner',
  LOCKSMITH = 'Locksmith',
  GARDENER = 'Gardener',
  // New categories for 'Construccion y Mantenimiento'
  ARCHITECT = 'Architect',
  MASON = 'Mason',
  CONSTRUCTION_WORKER = 'Construction Worker',
  WELDER = 'Welder',
  BLACKSMITH = 'Blacksmith',
  SURVEYOR = 'Surveyor',
  // New categories for 'Limpieza y Servicios Domésticos'
  HOUSEKEEPER = 'Housekeeper',
  JANITOR = 'Janitor',
  HOME_ASSISTANT = 'Home Assistant',
  LAUNDERER = 'Launderer',
  BUTLER = 'Butler',
  // New categories for 'Servicios y Oficios'
  COOK = 'Cook',
  WAITER = 'Waiter',
  TAXI_DRIVER = 'Taxi Driver',
  MECHANIC = 'Mechanic',
  HAIRDRESSER = 'Hairdresser',
  BAKER = 'Baker',
  TAILOR = 'Tailor',
  BARBER = 'Barber',
  MAIL_CARRIER = 'Mail Carrier',
  // New categories for 'Salud'
  DOCTOR = 'Doctor',
  NURSE = 'Nurse',
  DENTIST = 'Dentist',
  PHARMACIST = 'Pharmacist',
  PEDIATRICIAN = 'Pediatrician',
  SURGEON = 'Surgeon',
  PSYCHOLOGIST = 'Psychologist',
  PHYSICAL_THERAPIST = 'Physical Therapist',
  NUTRITIONIST = 'Nutritionist',
  // New categories for 'Educacion'
  TEACHER = 'Teacher',
  PRIMARY_SCHOOL_TEACHER = 'Primary School Teacher',
  LIBRARIAN = 'Librarian',
  SCHOOL_PRINCIPAL = 'School Principal',
  RESEARCHER = 'Researcher',
  PEDAGOGUE = 'Pedagogue',
  SCHOOL_COUNSELOR = 'School Counselor',
  // New categories for 'Negocios y Finanzas'
  ACCOUNTANT = 'Accountant',
  ADMINISTRATOR = 'Administrator',
  SALESPERSON = 'Salesperson',
  MANAGER = 'Manager',
  ECONOMIST = 'Economist',
  FINANCIAL_ANALYST = 'Financial Analyst',
  STOCKBROKER = 'Stockbroker',
  TREASURER = 'Treasurer',
  // New categories for 'Tecnologia y Medios'
  WEB_DEVELOPER = 'Web Developer',
  SYSTEMS_TECHNICIAN = 'Systems Technician',
  VIDEO_EDITOR = 'Video Editor',
  PHOTOGRAPHER = 'Photographer',
  DATA_SCIENTIST = 'Data Scientist',
  PROGRAMMER = 'Programmer',
  ENGINEER = 'Engineer',
  GRAPHIC_DESIGNER = 'Graphic Designer',
  JOURNALIST = 'Journalist',
  // New categories for 'Legal y Seguridad'
  LAWYER = 'Lawyer',
  POLICE_OFFICER = 'Police Officer',
  JUDGE = 'Judge',
  PROSECUTOR = 'Prosecutor',
  NOTARY = 'Notary',
  FIREFIGHTER = 'Firefighter',
  SECURITY_GUARD = 'Security Guard',
  PHONE_REPAIR = 'Phone Repair',
}

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface Availability {
  [key: string]: { start: string; end: string } | null;
}

export interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Money {
  amount: number;
  currency: string; // ISO 4217 currency code e.g. "USD", "BRL"
}

export interface PhoneNumber {
    code: string;
    number: string;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  password: string;
  service: ServiceCategory;
  jobTypes: string[];
  location: string;
  regions: string[];
  avgJobCost: Money;
  bio: string;
  avatarUrl: string;
  rating: number;
  reviews: Review[];
  availability: Availability;
  availabilityOverrides?: { [date: string]: { start: string; end: string } | null }; // Key is 'YYYY-MM-DD'
  signupDate: string; // ISO 8601 string
  lastLoginDate: string; // ISO 8601 string
  idNumber: string;
  phoneNumber: PhoneNumber;
  payoutDetails?: {
    bob_account?: string;
  };
  verificationStatus: 'pending' | 'approved' | 'declined';
  idPhotoUrl?: string;
  selfiePhotoUrl?: string;
  declineReason?: string;
  approvalDate?: string;
  adminApproverId?: string;
  userType?: 'worker' | 'admin';
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  location: string;
  avatarUrl: string;
  signupDate: string; // ISO 8601 string
  lastLoginDate: string; // ISO 8601 string
  rating: number;
  reviews: Review[];
  idNumber: string;
  phoneNumber: PhoneNumber;
  verificationStatus?: 'pending' | 'approved' | 'declined';
  userType?: 'user' | 'admin';
}

export interface JobRequest {
  id: string;
  user: User;
  workerId: string;
  service: ServiceCategory;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'worker_completed' | 'completed' | 'cancelled';
  userReview?: Review;
  workerReview?: Review;
  cancellationReason?: string;
  finalPrice?: number;
  invoiceId?: string;
  clientApprovedPayout?: boolean;
  disputeId?: string;
  createdAt: string; // ISO 8601
  startedAt?: string; // ISO 8601
  workerCompletedAt?: string; // ISO 8601
  clientConfirmedAt?: string; // ISO 8601
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id:string;
  jobId: string;
  workerId: string;
  userId: string;
  items: InvoiceLineItem[];
  subtotal: number;
  platformFee: number;
  total: number;
  currency: string;
  status: 'pending' | 'held' | 'released' | 'cancelled' | 'refunded' | 'partially_refunded';
  createdAt: string; // ISO 8601 string
  paidAt?: string;
  releasedAt?: string;
  transactionId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  invoiceId?: string;
  timestamp: string; // ISO 8601 string
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantA: User | Worker;
  participantB: User | Worker;
  lastMessage: Message;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_job' | 'status_update' | 'new_message' | 'new_registration' | 'new_dispute' | 'dispute_update' | 'new_support_chat';
  message: string;
  isRead: boolean;
  timestamp: string; // ISO 8601 string
  relatedEntityId: string; // e.g., jobId or conversationId
}

export type UserType = 'user' | 'worker' | 'admin';

export interface Transaction {
  id: string;
  invoiceId: string;
  jobId: string;
  clientId: string;
  workerId: string;
  subtotal: number;
  platformFee: number;
  total: number;
  currency: string;
  status: 'held' | 'released' | 'refunded' | 'partially_refunded';
  paidAt: string;
  releasedAt?: string;
  refundAmount?: number;
}

export interface DisputeMessage {
    id: string;
    senderId: string; // Can be user, worker, or admin
    text: string;
    timestamp: string;
}

export interface Dispute {
    id: string;
    jobId: string;
    raisedById: string;
    raisedByType: 'user' | 'worker';
    reason: string;
    status: 'open' | 'under_review' | 'resolved';
    messages: DisputeMessage[];
    resolution?: string;
    createdAt: string;
    resolvedAt?: string;
    fundResolution?: {
        action: 'release_full' | 'refund_full' | 'refund_partial';
        refundAmount?: number; // Only for partial refund
    };
}