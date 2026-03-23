import React, { useState, useEffect, useRef } from 'react';
import Header from './components/common/Header';
import NotificationsScreen from './components/shared/NotificationsScreen';
import BottomNavigation from './components/common/BottomNavigation';
import UserDashboard from './components/user/UserDashboard';
import WorkerProfile from './components/user/WorkerProfile';
import BookingScreen from './components/user/BookingScreen';
import LeaveReviewScreen from './components/user/LeaveReviewScreen';
// FIX: The file 'components/worker/JobRequestDetails.tsx' was missing. It has been created.
import JobRequestDetails from './components/worker/JobRequestDetails';
import WorkerDashboard from './components/worker/WorkerDashboard';
import WorkerProfileEdit from './components/worker/WorkerProfileEdit';
import UserProfileEdit from './components/user/UserProfileEdit';
import AuthScreen from './components/auth/AuthScreen';
import MessagingScreen from './components/shared/MessagingScreen';
import ConversationsScreen from './components/shared/ConversationsScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import ClientProfileAdminView from './components/admin/ClientProfileAdminView';
import WorkerProfileAdminView from './components/admin/WorkerProfileAdminView';
import EarningsScreen from './components/worker/EarningsScreen';
// FIX: The file 'components/user/MyJobsScreen.tsx' was missing. It has been created.
import MyJobsScreen from './components/user/MyJobsScreen';
import LeaveReviewForUserScreen from './components/worker/LeaveReviewForUserScreen';
import CreateJobInvoice from './components/worker/CreateJobInvoice';
import RaiseDisputeScreen from './components/new/RaiseDisputeScreen';
import DisputeDetailsScreen from './components/new/DisputeDetailsScreen';
import AdminDisputeResolutionScreen from './components/new/AdminDisputeResolutionScreen';
import AdminTermsEditScreen from './components/new/AdminTermsEditScreen';
import PasswordRecoveryScreen from './components/new/PasswordRecoveryScreen';
import ClientProfileForWorkerView from './components/new/ClientProfileForWorkerView';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFirestoreCollection } from './hooks/useFirestoreCollection';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useTranslations, Language } from './components/shared/LoginScreen';
import { Worker, User, JobRequest, ServiceCategory, UserType, Notification, Message, Conversation, Invoice, Review, InvoiceLineItem, Transaction, Dispute, DisputeMessage } from './types';
import AiSupportBubble from './components/shared/AiSupportBubble';
import { Content } from '@google/genai';
import WorkerVerificationScreen from './components/worker/WorkerVerificationScreen';
import VerificationPendingScreen from './components/auth/VerificationPendingScreen';
import AdminWorkerVerificationScreen from './components/admin/AdminWorkerVerificationScreen';
import { addWorkerToSpreadsheet, updateSpreadsheetVerificationStatus } from './services/spreadsheetService';

const DUMMY_USERS: User[] = [];

const DUMMY_JOB_REQUESTS: JobRequest[] = [];

const DUMMY_NOTIFICATIONS: Notification[] = [];

const DUMMY_MESSAGES: Message[] = [];

const ADMIN_ID = 'admin-1';

type View =
  | { screen: 'AUTH' }
  | { screen: 'USER_DASHBOARD' }
  | { screen: 'WORKER_PROFILE'; worker: Worker }
  | { screen: 'BOOKING'; worker: Worker }
  | { screen: 'LEAVE_REVIEW'; job: JobRequest }
  | { screen: 'LEAVE_REVIEW_FOR_USER'; job: JobRequest }
  | { screen: 'WORKER_DASHBOARD' }
  | { screen: 'JOB_DETAILS'; job: JobRequest }
  | { screen: 'WORKER_PROFILE_EDIT' }
  | { screen: 'USER_PROFILE_EDIT' }
  | { screen: 'MESSAGING'; conversationId: string }
  | { screen: 'CONVERSATIONS' }
  | { screen: 'ADMIN_DASHBOARD' }
  | { screen: 'ADMIN_CLIENT_PROFILE', user: User }
  | { screen: 'ADMIN_WORKER_PROFILE', worker: Worker }
  | { screen: 'ADMIN_MESSAGING', conversationId: string }
  | { screen: 'EARNINGS' }
  | { screen: 'MY_JOBS' }
  | { screen: 'CREATE_INVOICE'; job: JobRequest }
  | { screen: 'RAISE_DISPUTE'; job: JobRequest }
  | { screen: 'DISPUTE_DETAILS'; disputeId: string }
  | { screen: 'ADMIN_DISPUTE_DETAILS'; dispute: Dispute }
  | { screen: 'ADMIN_EDIT_TERMS' }
  | { screen: 'CLIENT_PROFILE_VIEW_BY_WORKER'; user: User; fromJob: JobRequest }
  | { screen: 'PASSWORD_RECOVERY' }
  | { screen: 'WORKER_VERIFICATION'; workerId: string }
  | { screen: 'VERIFICATION_PENDING' }
  | { screen: 'NOTIFICATIONS' }
  | { screen: 'ADMIN_WORKER_VERIFICATION'; worker: Worker };

const App: React.FC = () => {
  const { language, setLanguage, t } = useTranslations();
  const [currentUser, setCurrentUser] = useLocalStorage<User | Worker | null>('currentUser_v5', null);
  const [userType, setUserType] = useLocalStorage<UserType | null>('userType_v5', null);
  const [view, setView] = useState<View>({ screen: 'AUTH' });
  
  const [workers, setWorkers] = useFirestoreCollection<Worker>('workers', []);
  const [jobRequests, setJobRequests] = useFirestoreCollection<JobRequest>('jobRequests', DUMMY_JOB_REQUESTS);
  const [users, setUsers] = useFirestoreCollection<User>('users', DUMMY_USERS);
  const [notifications, setNotifications] = useFirestoreCollection<Notification>('notifications', DUMMY_NOTIFICATIONS);
  const [messages, setMessages] = useFirestoreCollection<Message>('messages', DUMMY_MESSAGES);
  const [invoices, setInvoices] = useFirestoreCollection<Invoice>('invoices', []);
  const [transactions, setTransactions] = useFirestoreCollection<Transaction>('transactions', []);
  const [disputes, setDisputes] = useFirestoreCollection<Dispute>('disputes', []);
  const [termsContentArr, setTermsContentArr] = useFirestoreCollection<{id: string, termsContent: string}>('systemConfig', [{id: 'termsAndServices', termsContent: 'Welcome to TUFIX!\n\nThese are the default terms and services. An administrator can edit this content from the Admin Dashboard.\n\n1. Introduction\nBy using our application, you agree to be bound by these Terms of Service. Please read them carefully.\n\n2. Services\nOur platform connects users seeking services with independent professional service providers. We are not a party to the service agreements between users and providers.\n\n3. User Accounts\nTo access most features, you must register for an account. You agree to provide accurate, current, and complete information during registration.\n\n4. Payments\nPayments for services are processed through our platform. We hold the funds in escrow until the client approves the payout after job completion. We charge a 10% platform fee on all transactions.\n\n5. Disputes\nIn case of a disagreement between a user and a provider, either party can raise a dispute. Our administrators will mediate and provide a final resolution.\n\n6. Limitation of Liability\nTUFIX is not liable for any damages arising from the services provided by the workers or the actions of the users. We are a platform to connect people.\n\n7. Changes to Terms\nWe may modify these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page.'}]);
  const termsContent = termsContentArr[0]?.termsContent || '';
  const setTermsContent = (newContent: string) => setTermsContentArr([{id: 'termsAndServices', termsContent: newContent}]);

  // State for Password Recovery
  const [recoveryUser, setRecoveryUser] = useState<User | Worker | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  const adminUser = users.find(u => u.userType === 'admin' || u.email === 'admin@tufix.com' || u.email === 'pampa.alex123@gmail.com');
  const currentAdminId = adminUser?.id || ADMIN_ID;

  const unreadNotificationsCount = currentUser 
    ? notifications.filter(n => n.userId === currentUser.id && !n.isRead).length 
    : 0;

  const prevUnreadCountRef = useRef(unreadNotificationsCount);

  useEffect(() => {
    if (unreadNotificationsCount > prevUnreadCountRef.current) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const playBeep = (time: number, freq: number) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.3, time + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            oscillator.start(time);
            oscillator.stop(time + 0.1);
        }
        
        playBeep(audioCtx.currentTime, 880);
        playBeep(audioCtx.currentTime + 0.15, 1108);
      } catch (e) {
        console.error("Could not play sound", e);
      }
    }
    prevUnreadCountRef.current = unreadNotificationsCount;
  }, [unreadNotificationsCount]);

  useEffect(() => {
    if (currentUser && userType) {
      if (userType === 'user') setView({ screen: 'USER_DASHBOARD' });
      else if (userType === 'worker') setView({ screen: 'WORKER_DASHBOARD' });
      else if (userType === 'admin') setView({ screen: 'ADMIN_DASHBOARD' });
    } else {
      if (view.screen !== 'PASSWORD_RECOVERY' && view.screen !== 'WORKER_VERIFICATION' && view.screen !== 'VERIFICATION_PENDING') {
        setView({ screen: 'AUTH' });
      }
    }
  }, [currentUser, userType]);
  
  const handleLogin = async (type: UserType, formData: any): Promise<string | null> => {
    if (type === 'admin' || (type === 'user' && formData.email === 'admin@admin' && formData.password === 'admin')) {
      if (formData.email !== 'admin@admin') {
          return 'Invalid admin credentials.';
      }
      if (formData.email === 'admin@admin' && formData.password === 'admin') {
        let adminUid = ADMIN_ID;
        try {
          const cred = await signInWithEmailAndPassword(auth, 'admin@tufix.com', 'admin123');
          adminUid = cred.user.uid;
        } catch (e: any) {
          try {
            const cred = await createUserWithEmailAndPassword(auth, 'admin@tufix.com', 'admin123');
            adminUid = cred.user.uid;
          } catch (err) {
            console.error("Failed to create admin user", err);
          }
        }
        const adminUser: User = {
          id: adminUid,
          name: 'Admin User',
          email: 'admin@admin',
          password: 'admin',
          location: 'System HQ',
          avatarUrl: 'https://picsum.photos/seed/admin/200',
          signupDate: new Date().toISOString(),
          lastLoginDate: new Date().toISOString(),
          rating: 0,
// FIX: Add missing idNumber and phoneNumber properties to satisfy the User type.
          reviews: [],
          idNumber: '000-00-0000',
// FIX: Changed phoneNumber from a string to a PhoneNumber object to match the type definition.
          phoneNumber: { code: '+1', number: '555-555-5555' },
          userType: 'admin',
        };
        // Ensure admin user exists in users collection so rules pass
        if (!users.find(u => u.id === adminUid)) {
          setUsers(prev => [...prev, adminUser]);
        }
        setCurrentUser(adminUser);
        setUserType('admin');
        return null;
      } else {
        return 'Incorrect admin password.';
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const data = userCredential;
      const error = null;

      if (type === 'user') {
        let user = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
        if (!user) {
          // Recreate user if missing from local storage but exists in Supabase
          user = {
            id: data.user?.uid || `user-${Date.now()}`,
            name: formData.email.split('@')[0], // Fallback name
            email: formData.email,
            password: formData.password,
            location: 'New City, NC',
            avatarUrl: `https://picsum.photos/seed/${formData.email}/200`,
            signupDate: new Date().toISOString(),
            lastLoginDate: new Date().toISOString(),
            rating: 0,
            reviews: [],
            idNumber: '000-00-0000',
            phoneNumber: { code: '+1', number: '555-555-5555' },
            verificationStatus: 'approved',
            userType: 'user',
          };
          setUsers(prev => [...prev, user!]);
        }
        setCurrentUser(user);
        setUserType('user');
        return null;
      } else if (type === 'worker') {
        let worker = workers.find(w => w.email.toLowerCase() === formData.email.toLowerCase());
        if (!worker) {
          // Recreate worker if missing from local storage but exists in Supabase
          worker = {
            id: data.user?.uid || `worker-${Date.now()}`,
            name: formData.email.split('@')[0], // Fallback name
            email: formData.email,
            password: formData.password,
            service: ServiceCategory.HANDYMAN,
            jobTypes: ['General Repairs'],
            location: 'New City, NC',
            regions: ['Downtown'],
            avgJobCost: { amount: 100, currency: 'USD' },
            bio: 'Restored service provider profile.',
            avatarUrl: `https://picsum.photos/seed/${formData.email}/200`,
            rating: 0,
            reviews: [],
            availability: {
              Monday: { start: '09:00', end: '17:00' },
              Tuesday: { start: '09:00', end: '17:00' },
              Wednesday: { start: '09:00', end: '17:00' },
              Thursday: { start: '09:00', end: '17:00' },
              Friday: { start: '09:00', end: '17:00' },
              Saturday: null,
              Sunday: null,
            },
            signupDate: new Date().toISOString(),
            lastLoginDate: new Date().toISOString(),
            idNumber: '000-00-0000',
            phoneNumber: { code: '+1', number: '555-555-5555' },
            verificationStatus: 'approved', // Auto-approve restored workers to avoid getting stuck
            userType: 'worker',
          };
          setWorkers(prev => [...prev, worker!]);
        }

        if (worker.verificationStatus === 'pending') {
            return "Your account is awaiting verification. You will be notified once it's approved.";
        }
        if (worker.verificationStatus === 'declined') {
            return `Your account application was declined. Reason: ${worker.declineReason || 'No reason provided.'}`;
        }

        setCurrentUser(worker);
        setUserType('worker');
        return null;
      }
    } catch (err: any) {
      return err.message || 'An error occurred during login.';
    }
    return 'An unexpected error occurred.';
  };
  
  const handleSignUp = async (type: UserType, formData: any): Promise<string | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const data = userCredential;
      const error = null;

      if (type === 'user') {
        if (users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
          return 'An account with this email already exists. Please log in.';
        }
        const newUser: User = {
          id: data.user?.uid || `user-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          location: 'New City, NC',
          avatarUrl: `https://picsum.photos/seed/${formData.email}/200`,
          signupDate: new Date().toISOString(),
          lastLoginDate: new Date().toISOString(),
          rating: 0,
// FIX: Add missing idNumber and phoneNumber properties to satisfy the User type.
          reviews: [],
          idNumber: formData.idNumber,
// FIX: Changed phoneNumber from a string to a PhoneNumber object to match the type definition and use form data.
          phoneNumber: { code: formData.countryCode, number: formData.phoneNumber },
          verificationStatus: 'approved',
          userType: 'user',
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        setUserType('user');
        setNotifications(prev => [...prev, {
            id: `notif-reg-user-${Date.now()}`,
            userId: currentAdminId,
            type: 'new_registration',
            message: `New client signed up: ${newUser.name}.`,
            isRead: false,
            timestamp: new Date().toISOString(),
            relatedEntityId: newUser.id,
        }]);
        return null;
      } else if (type === 'worker') {
        if (workers.some(w => w.email.toLowerCase() === formData.email.toLowerCase())) {
          return 'An account with this email already exists. Please log in.';
        }
        const newWorker: Worker = {
          id: data.user?.uid || `worker-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          service: ServiceCategory.HANDYMAN,
          jobTypes: ['General Repairs'],
          location: 'New City, NC',
          regions: ['Downtown'],
          avgJobCost: { amount: 100, currency: 'USD' },
          bio: 'Newly registered service provider.',
          avatarUrl: `https://picsum.photos/seed/${formData.email}/200`,
          rating: 0,
          reviews: [],
          availability: {
            Monday: { start: '09:00', end: '17:00' },
            Tuesday: { start: '09:00', end: '17:00' },
            Wednesday: { start: '09:00', end: '17:00' },
            Thursday: { start: '09:00', end: '17:00' },
            Friday: { start: '09:00', end: '17:00' },
            Saturday: null,
            Sunday: null,
          },
          signupDate: new Date().toISOString(),
          lastLoginDate: new Date().toISOString(),
          idNumber: formData.idNumber,
          phoneNumber: { code: formData.countryCode, number: formData.phoneNumber },
          verificationStatus: 'pending',
          userType: 'worker',
        };
        setWorkers(prev => [...prev, newWorker]);
        
        addWorkerToSpreadsheet(newWorker).catch(error => {
          console.error("Failed to add worker to spreadsheet:", error);
        });
        
        setView({ screen: 'WORKER_VERIFICATION', workerId: newWorker.id });
        return null;
      }
    } catch (err: any) {
      return err.message || 'An error occurred during sign up.';
    }
    return 'An unexpected error occurred during sign up.';
  };

  const handleLogout = () => {
    signOut(auth).catch(console.error);
    setCurrentUser(null);
    setUserType(null);
    setView({ screen: 'AUTH' });
  };
  
  // --- Password Recovery Handlers ---
  const handleForgotPassword = () => {
    setRecoveryError('');
    setView({ screen: 'PASSWORD_RECOVERY' });
  };

  const handleSendRecoveryCode = (emailOrPhone: string): boolean => {
    setRecoveryError('');
    const allUsersAndWorkers = [...users, ...workers];
    const foundUser = allUsersAndWorkers.find(u =>
        u.email.toLowerCase() === emailOrPhone.toLowerCase() ||
        `${u.phoneNumber.code}${u.phoneNumber.number}`.replace(/\D/g, '') === emailOrPhone.replace(/\D/g, '')
    );

    if (foundUser) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setRecoveryUser(foundUser);
        setRecoveryCode(code);
        // Simulate sending code via alert
        setTimeout(() => alert(t('your tufix recovery code is', {code: code})), 100);
        return true;
    } else {
        setRecoveryError(t('user not found'));
        return false;
    }
  };

  const handleVerifyRecoveryCode = (code: string): boolean => {
    setRecoveryError('');
    if (code === recoveryCode) {
        return true;
    } else {
        setRecoveryError(t('invalid code'));
        return false;
    }
  };

  const handleResetPassword = (password: string): boolean => {
    setRecoveryError('');
    if (!recoveryUser) {
        setRecoveryError('An unexpected error occurred. Please start over.');
        return false;
    }

    const updateUserInStorage = (prev: (User | Worker)[]) => prev.map(u => u.id === recoveryUser.id ? { ...u, password } : u);

    let recoveredUserType: UserType;
    if ('service' in recoveryUser) { // It's a Worker
        setWorkers(updateUserInStorage as (prev: Worker[]) => Worker[]);
        recoveredUserType = 'worker';
    } else { // It's a User
        setUsers(updateUserInStorage as (prev: User[]) => User[]);
        recoveredUserType = 'user';
    }
    
    // Log the user in
    setCurrentUser({ ...recoveryUser, password });
    setUserType(recoveredUserType);

    // Clean up recovery state
    setRecoveryUser(null);
    setRecoveryCode(null);
    alert(t('password reset success'));
    // The useEffect will handle navigation to the dashboard
    return true;
  };

  const handleVerificationSubmit = (workerId: string, idPhotoUrl: string, selfiePhotoUrl: string) => {
    let workerName = '';
    setWorkers(prev => prev.map(w => {
      if (w.id === workerId) {
        workerName = w.name;
        return { ...w, idPhotoUrl, selfiePhotoUrl };
      }
      return w;
    }));
    setNotifications(prev => [...prev, {
      id: `notif-verify-${Date.now()}`,
      userId: currentAdminId,
      type: 'new_registration',
      message: `New provider ${workerName} requires identity verification.`,
      isRead: false,
      timestamp: new Date().toISOString(),
      relatedEntityId: workerId,
    }]);
    setView({ screen: 'VERIFICATION_PENDING' });
  };

  const handleApproveWorker = (workerId: string) => {
    const adminId = currentUser!.id;
    const approvalTimestamp = new Date().toISOString();
    let approvedWorkerForSpreadsheet: Worker | null = null;

    setWorkers(prev => {
        const newWorkers = prev.map(w => {
            if (w.id === workerId) {
                const updatedWorker = {
                    ...w,
                    verificationStatus: 'approved' as const,
                    approvalDate: approvalTimestamp,
                    adminApproverId: adminId,
                };
                approvedWorkerForSpreadsheet = updatedWorker;
                return updatedWorker;
            }
            return w;
        });
        return newWorkers;
    });

    setNotifications(prev => [...prev, {
      id: `notif-approved-${Date.now()}`,
      userId: workerId,
      type: 'status_update',
      message: 'Congratulations! Your TUFIX account has been approved. You can now log in.',
      isRead: false,
      timestamp: new Date().toISOString(),
      relatedEntityId: workerId,
    }]);
    
    if (approvedWorkerForSpreadsheet) {
        alert(t('account has been approved', {name: approvedWorkerForSpreadsheet.name}));
        updateSpreadsheetVerificationStatus(approvedWorkerForSpreadsheet).catch(error => {
            console.error("Failed to update spreadsheet for approved worker:", error);
        });
    }

    setView({ screen: 'ADMIN_DASHBOARD' });
  };

  const handleDeclineWorker = (workerId: string, reason: string) => {
    const adminId = currentUser!.id;
    const decisionTimestamp = new Date().toISOString();
    let declinedWorkerForSpreadsheet: Worker | null = null;

    setWorkers(prev => {
        const newWorkers = prev.map(w => {
            if (w.id === workerId) {
                const updatedWorker = {
                    ...w,
                    verificationStatus: 'declined' as const,
                    declineReason: reason,
                    approvalDate: decisionTimestamp,
                    adminApproverId: adminId,
                };
                declinedWorkerForSpreadsheet = updatedWorker;
                return updatedWorker;
            }
            return w;
        });
        return newWorkers;
    });

    setNotifications(prev => [...prev, {
      id: `notif-declined-${Date.now()}`,
      userId: workerId,
      type: 'status_update',
      message: `We're sorry, your TUFIX account application was not approved. Reason: ${reason}`,
      isRead: false,
      timestamp: new Date().toISOString(),
      relatedEntityId: workerId,
    }]);
    
    if (declinedWorkerForSpreadsheet) {
        alert(t('account has been declined', {name: declinedWorkerForSpreadsheet.name}));
        updateSpreadsheetVerificationStatus(declinedWorkerForSpreadsheet).catch(error => {
            console.error("Failed to update spreadsheet for declined worker:", error);
        });
    }

    setView({ screen: 'ADMIN_DASHBOARD' });
  };


  const handleBookNow = (worker: Worker) => {
    if (userType === 'user') {
      setView({ screen: 'BOOKING', worker });
    } else {
      alert(t('please log in as a user to book a service'));
    }
  };

  const handleBookingSubmit = (details: { worker: Worker; date: string; time: string; description: string; }) => {
    const newJob: JobRequest = {
      id: `job-${Date.now()}`,
      user: currentUser as User,
      workerId: details.worker.id,
      service: details.worker.service,
      description: details.description,
      date: details.date,
      time: details.time,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setJobRequests(prev => [newJob, ...prev]);
    // Simulate notification for worker
    setNotifications(prev => [...prev, {
      id: `notif-${Date.now()}`,
      userId: details.worker.id,
      type: 'new_job',
      message: `You have a new job request from ${currentUser!.name} for ${details.worker.service}.`,
      isRead: false,
      timestamp: new Date().toISOString(),
      relatedEntityId: newJob.id
    }]);
    setView({ screen: 'MY_JOBS' });
    alert(t('booking request submitted successfully'));
  };

  const handleLeaveUserReview = (job: JobRequest) => {
    setView({ screen: 'LEAVE_REVIEW', job });
  };

  const handleLeaveWorkerReview = (job: JobRequest) => {
    setView({ screen: 'LEAVE_REVIEW_FOR_USER', job });
  };
  
  const handleUserReviewSubmit = (jobId: string, reviewData: { rating: number; comment: string }) => {
    const newReview: Review = {
        author: currentUser!.name,
        date: new Date().toLocaleDateString('en-US', {month: 'long', year: 'numeric'}),
        ...reviewData
    };

    setJobRequests(prev => prev.map(job => 
        job.id === jobId ? { ...job, userReview: newReview } : job
    ));
    
    const job = jobRequests.find(j => j.id === jobId);
    if(job) {
        setWorkers(prev => prev.map(w => {
            if (w.id === job.workerId) {
                const currentReviews = w.reviews || [];
                const newRating = ((w.rating * currentReviews.length) + reviewData.rating) / (currentReviews.length + 1);
                return { ...w, rating: parseFloat(newRating.toFixed(2)), reviews: [...currentReviews, newReview] };
            }
            return w;
        }));
    }
    setView({ screen: 'MY_JOBS' });
  };

  const handleWorkerReviewSubmit = (jobId: string, reviewData: { rating: number; comment: string }) => {
    const newReview: Review = {
        author: currentUser!.name,
        date: new Date().toLocaleDateString('en-US', {month: 'long', year: 'numeric'}),
        ...reviewData
    };

    setJobRequests(prev => prev.map(job => 
        job.id === jobId ? { ...job, workerReview: newReview } : job
    ));
    
    const job = jobRequests.find(j => j.id === jobId);
    if(job) {
        setUsers(prev => prev.map(u => {
            if (u.id === job.user.id) {
                const currentReviews = u.reviews || [];
                const newRating = ((u.rating * currentReviews.length) + reviewData.rating) / (currentReviews.length + 1);
                return { ...u, rating: parseFloat(newRating.toFixed(2)), reviews: [...currentReviews, newReview] };
            }
            return u;
        }));
    }
    setView({ screen: 'WORKER_DASHBOARD' });
  };

  const handleCancelJob = (jobId: string, reason: string) => {
    const job = jobRequests.find(j => j.id === jobId);
    if (!job) return;

    setJobRequests(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'cancelled', cancellationReason: reason } : j
    ));

    // Notify the other party
    const recipientId = userType === 'user' ? job.workerId : job.user.id;
    setNotifications(prev => [...prev, {
        id: `notif-cancel-${Date.now()}`,
        userId: recipientId,
        type: 'status_update',
        message: `Your ${job.service} request for ${new Date(job.date + 'T00:00:00').toLocaleDateString()} has been cancelled.`,
        isRead: false,
        timestamp: new Date().toISOString(),
        relatedEntityId: job.id
    }]);
  };
  
  const handleUpdateJobStatus = (jobId: string, status: JobRequest['status']) => {
    const now = new Date().toISOString();
    setJobRequests(prev => prev.map(job => {
        if (job.id === jobId) {
            const updatedJob = { ...job, status };
            if (status === 'in_progress') updatedJob.startedAt = now;
            if (status === 'worker_completed') updatedJob.workerCompletedAt = now;
            return updatedJob;
        }
        return job;
    }));

    const job = jobRequests.find(j => j.id === jobId);
    if (!job) return;

    let notificationMessage = '';
    let recipientId = job.user.id;

    switch (status) {
      case 'accepted':
      case 'declined':
        notificationMessage = `Your ${job.service} request has been ${status}.`;
        break;
      case 'in_progress':
        notificationMessage = `${currentUser!.name} has started working on your ${job.service} job.`;
        break;
      case 'worker_completed':
        notificationMessage = `${currentUser!.name} has marked the ${job.service} job as complete. Please confirm to proceed.`;
        break;
    }

    if (notificationMessage) {
        setNotifications(prev => [...prev, {
            id: `notif-${status}-${Date.now()}`,
            userId: recipientId,
            type: 'status_update',
            message: notificationMessage,
            isRead: false,
            timestamp: new Date().toISOString(),
            relatedEntityId: job.id,
        }]);
    }
    
    // Navigate based on status
    if (status === 'accepted') {
        const updatedJob = { ...job, status };
        setView({ screen: 'CREATE_INVOICE', job: updatedJob });
    } else if (status === 'declined' || status === 'worker_completed' || status === 'in_progress') {
        setView({ screen: 'WORKER_DASHBOARD' });
    }
  };

  const handleConfirmAndReleasePayment = (jobId: string) => {
    const job = jobRequests.find(j => j.id === jobId);
    if (!job || !job.invoiceId) return;

    if (job.disputeId) {
        const dispute = disputes.find(d => d.id === job.disputeId);
        if (dispute && dispute.status !== 'resolved') {
            alert(t('cannot release payment while dispute is active'));
            return;
        }
    }

    const invoice = invoices.find(inv => inv.id === job.invoiceId);
    if (!invoice || invoice.status !== 'held') {
        alert(t('error invoice is not in a payable state'));
        return;
    }

    const now = new Date().toISOString();

    setJobRequests(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: 'completed', clientApprovedPayout: true, clientConfirmedAt: now } : j
    ));

    setInvoices(prev => prev.map(inv => 
        inv.id === job.invoiceId ? { ...inv, status: 'released', releasedAt: now } : inv
    ));
    
    setTransactions(prev => prev.map(t => 
        t.invoiceId === job.invoiceId ? { ...t, status: 'released', releasedAt: now } : t
    ));

    setNotifications(prev => [...prev, {
        id: `notif-release-${Date.now()}`,
        userId: invoice.workerId,
        type: 'status_update',
        message: `Funds for invoice #${invoice.id.slice(-6)} have been released to your account!`,
        isRead: false,
        timestamp: now,
        relatedEntityId: invoice.jobId,
    }]);
    alert(t('job confirmed and payment released'));
  };

  const handleSaveWorkerProfile = (updatedWorker: Worker) => {
    setWorkers(prev => prev.map(w => w.id === updatedWorker.id ? updatedWorker : w));
    setCurrentUser(updatedWorker);
    setView({ screen: 'WORKER_DASHBOARD' });
    alert(t('profile updated successfully'));
  };
  
  const handleSaveUserProfile = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setView({ screen: 'USER_DASHBOARD' });
    alert(t('profile updated successfully'));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => n.userId === currentUser?.id ? { ...n, isRead: true } : n));
  };
  
  const handleNotificationClick = (notification: Notification) => {
     setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
     
     if (notification.type === 'new_message') {
        setView({ screen: 'MESSAGING', conversationId: notification.relatedEntityId });
        return;
     }

     if (notification.type === 'new_job' || notification.type === 'status_update') {
        const job = jobRequests.find(j => j.id === notification.relatedEntityId);
        if (!job) return;

        if (userType === 'worker') {
            setView({ screen: 'JOB_DETAILS', job });
        } else if (userType === 'user') {
            setView({ screen: 'MY_JOBS' });
        }
     }
     
     if (notification.type === 'new_dispute') {
        const dispute = disputes.find(d => d.id === notification.relatedEntityId);
        if (dispute && userType === 'admin') {
            setView({ screen: 'ADMIN_DISPUTE_DETAILS', dispute });
        }
     }
     
     if (notification.type === 'dispute_update') {
        setView({ screen: 'DISPUTE_DETAILS', disputeId: notification.relatedEntityId });
     }
     
      if (notification.type === 'new_support_chat' && userType === 'admin') {
        setView({ screen: 'MESSAGING', conversationId: notification.relatedEntityId });
        return;
     }

     if (userType === 'admin' && notification.type === 'new_registration') {
        const user = users.find(u => u.id === notification.relatedEntityId);
        if (user) {
            setView({ screen: 'ADMIN_CLIENT_PROFILE', user });
            return;
        }
        const worker = workers.find(w => w.id === notification.relatedEntityId);
        if (worker) {
            if (worker.verificationStatus === 'pending' && worker.idPhotoUrl) {
                setView({ screen: 'ADMIN_WORKER_VERIFICATION', worker });
            } else {
                setView({ screen: 'ADMIN_WORKER_PROFILE', worker });
            }
            return;
        }
     }
  };
  
  const handleContact = (recipient: User | Worker) => {
    // simplified: find or create conversation and open messaging
    const conversationId = `conv_${[currentUser!.id, recipient.id].sort().join('_')}`;
    setView({ screen: 'MESSAGING', conversationId });
  };
  
  const handleAdminViewConversation = (conversationId: string) => {
    if (userType === 'admin') {
      setView({ screen: 'ADMIN_MESSAGING', conversationId });
    }
  };

  const handleViewClientProfile = (user: User, fromJob: JobRequest) => {
    setView({ screen: 'CLIENT_PROFILE_VIEW_BY_WORKER', user, fromJob });
  };

  const handleViewParticipantProfile = (participant: User | Worker) => {
    if ('service' in participant) {
      // It's a Worker
      setView({ screen: 'WORKER_PROFILE', worker: participant as Worker });
    } else {
      // It's a User
      // If the current user is a worker, they might want to see the client profile.
      // However, the CLIENT_PROFILE_VIEW_BY_WORKER screen requires a 'fromJob'.
      // For now, if it's a user, we don't have a dedicated "User Profile" view for other users
      // unless it's the admin view.
      if (userType === 'admin') {
        setView({ screen: 'ADMIN_CLIENT_PROFILE', user: participant as User });
      } else if (userType === 'worker') {
        // Try to find a job associated with this user to satisfy the CLIENT_PROFILE_VIEW_BY_WORKER screen
        const associatedJob = jobRequests.find(j => j.user.id === participant.id && j.workerId === currentUser?.id);
        if (associatedJob) {
          setView({ screen: 'CLIENT_PROFILE_VIEW_BY_WORKER', user: participant as User, fromJob: associatedJob });
        } else {
          // If no job found, we can't easily show the profile with the current screen structure
          // but we can at least alert or do nothing.
          // For now, let's just not do anything if no job is found.
        }
      }
    }
  };

  const handleSendMessage = (receiverId: string, content: { text?: string; imageUrl?: string; }) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser!.id,
      receiverId,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    if (content.text) {
      newMessage.text = content.text;
    } else if (content.imageUrl) {
      newMessage.imageUrl = content.imageUrl;
    }
    
    setMessages(prev => [...prev, newMessage]);

    // Add notification for the receiver
    const conversationId = `conv_${[currentUser!.id, receiverId].sort().join('_')}`;
    setNotifications(prev => [...prev, {
      id: `notif-msg-${Date.now()}`,
      userId: receiverId,
      type: 'new_message',
      message: `You have a new message from ${currentUser!.name}.`,
      isRead: false,
      timestamp: new Date().toISOString(),
      relatedEntityId: conversationId,
    }]);
  };

  const handleCreateAndSendInvoice = (jobId: string, invoiceData: { items: InvoiceLineItem[], subtotal: number, platformFee: number, total: number }) => {
    const job = jobRequests.find(j => j.id === jobId);
    const worker = currentUser as Worker;
    if (!job || !worker) return;
    
    const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        jobId: job.id,
        workerId: worker.id,
        userId: job.user.id,
        ...invoiceData,
        currency: worker.avgJobCost.currency,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    
    let updatedJob: JobRequest | undefined;
    setInvoices(prev => [...prev, newInvoice]);

    setJobRequests(prev => prev.map(j => {
        if (j.id === jobId) {
            updatedJob = { ...j, invoiceId: newInvoice.id, finalPrice: invoiceData.subtotal };
            return updatedJob;
        }
        return j;
    }));
    
    setNotifications(prev => [...prev, {
        id: `notif-inv-${Date.now()}`,
        userId: job.user.id,
        type: 'status_update',
        message: `${worker.name} has sent an invoice for ${newInvoice.total.toFixed(2)} ${newInvoice.currency}.`,
        isRead: false,
        timestamp: new Date().toISOString(),
        relatedEntityId: job.id
    }]);

    if (updatedJob) {
        setView({ screen: 'JOB_DETAILS', job: updatedJob });
    } else {
        setView({ screen: 'WORKER_DASHBOARD' });
    }
    alert(t('invoice sent you can now start the job'));
  };
  
  const handlePayInvoice = (invoiceId: string) => {
    let paidInvoice: Invoice | undefined;
    
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        paidInvoice = {
          ...inv,
          status: 'held',
          paidAt: new Date().toISOString(),
          transactionId: `txn_${Date.now()}`
        };
        return paidInvoice;
      }
      return inv;
    }));

    if (paidInvoice) {
      const newTransaction: Transaction = {
        id: paidInvoice.transactionId!,
        invoiceId: paidInvoice.id,
        jobId: paidInvoice.jobId,
        clientId: paidInvoice.userId,
        workerId: paidInvoice.workerId,
        subtotal: paidInvoice.subtotal,
        platformFee: paidInvoice.platformFee,
        total: paidInvoice.total,
        currency: paidInvoice.currency,
        status: 'held',
        paidAt: paidInvoice.paidAt!,
      };
      setTransactions(prev => [...prev, newTransaction]);

      setNotifications(prev => [...prev, {
          id: `notif-paid-${Date.now()}`,
          userId: paidInvoice!.workerId,
          type: 'status_update',
          message: `Payment for invoice #${paidInvoice!.id.slice(-6)} has been secured. Awaiting client approval to release funds.`,
          isRead: false,
          timestamp: new Date().toISOString(),
          relatedEntityId: paidInvoice!.jobId,
      }]);
    }
    alert(t('payment successful funds held securely'));
  };

  const handleRaiseDispute = (jobId: string, reason: string) => {
    const job = jobRequests.find(j => j.id === jobId);
    if (!job) return;
    
    const newDispute: Dispute = {
        id: `disp-${Date.now()}`,
        jobId,
        raisedById: currentUser!.id,
        raisedByType: userType as 'user' | 'worker',
        reason,
        status: 'open',
        messages: [],
        createdAt: new Date().toISOString(),
    };

    setDisputes(prev => [...prev, newDispute]);
    setJobRequests(prev => prev.map(j => j.id === jobId ? { ...j, disputeId: newDispute.id } : j));
    
    // Notify admin
    setNotifications(prev => [...prev, {
        id: `notif-disp-${Date.now()}`,
        userId: ADMIN_ID,
        type: 'new_dispute',
        message: `A new dispute has been raised by ${currentUser!.name} for job #${jobId.slice(-6)}.`,
        isRead: false,
        timestamp: new Date().toISOString(),
        relatedEntityId: newDispute.id
    }]);
    
    alert(t('provide dispute reason alert'));
    
    if (userType === 'user') setView({ screen: 'MY_JOBS' });
    else if (userType === 'worker') setView({ screen: 'WORKER_DASHBOARD' });
  };
  
  const handleAdminSendDisputeMessage = (disputeId: string, text: string) => {
    const dispute = disputes.find(d => d.id === disputeId);
    if (!dispute) return;

    const newMessage: DisputeMessage = {
        id: `disp-msg-${Date.now()}`,
        senderId: ADMIN_ID,
        text,
        timestamp: new Date().toISOString(),
    };

    setDisputes(prev => prev.map(d => 
        d.id === disputeId ? { ...d, messages: [...d.messages, newMessage], status: 'under_review' } : d
    ));

    const job = jobRequests.find(j => j.id === dispute.jobId);
    if (job) {
        // Notify both parties
        [job.user.id, job.workerId].forEach(userId => {
            setNotifications(prev => [...prev, {
                id: `notif-disp-upd-${userId}-${Date.now()}`,
                userId: userId,
                type: 'dispute_update',
                message: `An admin has sent a message regarding your dispute for job #${job.id.slice(-6)}.`,
                isRead: false,
                timestamp: new Date().toISOString(),
                relatedEntityId: disputeId,
            }]);
        });
    }
  };
  
  const handleAdminResolveDispute = (
    disputeId: string, 
    resolution: string, 
    fundAction: 'release_full' | 'refund_full' | 'refund_partial', 
    partialAmount?: number
  ) => {
      const dispute = disputes.find(d => d.id === disputeId);
      const job = jobRequests.find(j => j.id === dispute?.jobId);
      const invoice = invoices.find(i => i.id === job?.invoiceId);
      if (!dispute || !job || !invoice) {
          alert(t('error could not find all related records for this dispute'));
          return;
      }
      
      const now = new Date().toISOString();

      // Update Dispute
      setDisputes(prev => prev.map(d => d.id === disputeId ? { 
          ...d, 
          status: 'resolved', 
          resolution, 
          resolvedAt: now,
          fundResolution: { action: fundAction, refundAmount: partialAmount }
      } : d));
      
      let newInvoiceStatus: Invoice['status'] = invoice.status;
      let newTransactionStatus: Transaction['status'] = 'held';
      let refundAmount: number | undefined = undefined;

      // Update Invoice and Transaction based on action
      switch(fundAction) {
          case 'release_full':
              newInvoiceStatus = 'released';
              newTransactionStatus = 'released';
              break;
          case 'refund_full':
              newInvoiceStatus = 'refunded';
              newTransactionStatus = 'refunded';
              refundAmount = invoice.total;
              break;
          case 'refund_partial':
              newInvoiceStatus = 'partially_refunded';
              newTransactionStatus = 'partially_refunded';
              refundAmount = partialAmount;
              break;
      }
      
      setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status: newInvoiceStatus, releasedAt: now } : i));
      setTransactions(prev => prev.map(t => t.invoiceId === invoice.id ? { ...t, status: newTransactionStatus, releasedAt: now, refundAmount } : t));

      // Notify both parties
      [job.user.id, job.workerId].forEach(userId => {
        setNotifications(prev => [...prev, {
            id: `notif-disp-res-${userId}-${Date.now()}`,
            userId: userId,
            type: 'dispute_update',
            message: `Your dispute for job #${job.id.slice(-6)} has been resolved.`,
            isRead: false,
            timestamp: now,
            relatedEntityId: disputeId,
        }]);
      });
      
      alert(t('dispute has been resolved and funds have been processed'));
      setView({ screen: 'ADMIN_DASHBOARD' });
  };


  const handleMarkMessagesAsRead = (otherParticipantId: string) => {
    setMessages(prev => prev.map(msg => {
        if (msg.senderId === otherParticipantId && msg.receiverId === currentUser!.id && !msg.isRead) {
            return { ...msg, isRead: true };
        }
        return msg;
    }));
  };

  const handleSaveTerms = (newContent: string) => {
    setTermsContent(newContent);
    setView({ screen: 'ADMIN_DASHBOARD' });
    alert(t('terms and services updated successfully'));
  };

  const handleRequestHumanSupport = (chatHistory: Content[]) => {
    if (!currentUser) return;

    const conversationId = `conv_${[currentUser.id, ADMIN_ID].sort().join('_')}`;

    // Transform chat history and prepend it to the conversation
    const newMessages: Message[] = chatHistory.map((content, index) => {
        const senderId = content.role === 'user' ? currentUser.id : ADMIN_ID;
        const receiverId = content.role === 'user' ? ADMIN_ID : currentUser.id;
        return {
            id: `support-msg-${Date.now()}-${index}`,
            senderId: senderId,
            receiverId: receiverId,
            text: content.parts[0].text,
            timestamp: new Date(Date.now() + index).toISOString(), // ensure unique timestamps for sorting
            isRead: senderId === currentUser.id, // User's own messages are "read"
        };
    });

    setMessages(prev => [...prev, ...newMessages]);

    // Create notification for admin
    setNotifications(prev => [...prev, {
        id: `notif-support-${Date.now()}`,
        userId: ADMIN_ID,
        type: 'new_support_chat',
        message: `New live support request from ${currentUser.name}.`,
        isRead: false,
        timestamp: new Date().toISOString(),
        relatedEntityId: conversationId,
    }]);

    // Alert user and redirect to conversation
    alert(t('you have been connected to a live support agent'));
    setView({ screen: 'MESSAGING', conversationId });
  };

  const allWorkers = workers; // Pass all workers to UserDashboard

  const handleClearAllData = async () => {
    // Keep the current admin user if they are in the users or workers list
    const adminInUsers = users.find(u => u.id === currentUser?.id);
    const adminInWorkers = workers.find(w => w.id === currentUser?.id);
    
    setUsers(adminInUsers ? [adminInUsers] : []);
    setWorkers(adminInWorkers ? [adminInWorkers] : []);
    setJobRequests([]);
    setNotifications([]);
    setMessages([]);
    setInvoices([]);
    setTransactions([]);
    setDisputes([]);
  };

  const renderContent = () => {
    switch (view.screen) {
      case 'AUTH':
        return <AuthScreen onLogin={handleLogin} onSignUp={handleSignUp} onForgotPassword={handleForgotPassword} t={t} termsContent={termsContent} />;
      case 'PASSWORD_RECOVERY':
        return <PasswordRecoveryScreen
            error={recoveryError}
            onSendCode={handleSendRecoveryCode}
            onVerifyCode={handleVerifyRecoveryCode}
            onResetPassword={handleResetPassword}
            onBackToLogin={() => setView({ screen: 'AUTH' })}
            t={t}
        />;
      case 'WORKER_VERIFICATION':
        const worker = workers.find(w => w.id === view.workerId);
        return <WorkerVerificationScreen 
            workerId={view.workerId}
            phoneNumber={worker ? `${worker.phoneNumber.code} ${worker.phoneNumber.number}` : ''}
            onSubmit={handleVerificationSubmit}
            onBack={() => setView({ screen: 'AUTH' })}
            t={t}
        />;
      case 'VERIFICATION_PENDING':
        return <VerificationPendingScreen 
            onBackToHome={() => setView({ screen: 'AUTH' })}
            t={t}
        />;
      case 'USER_DASHBOARD':
        return <UserDashboard 
          workers={allWorkers.filter(w => w.verificationStatus === 'approved')}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onSelectWorker={(worker) => setView({ screen: 'WORKER_PROFILE', worker })}
          t={t}
        />;
      case 'WORKER_PROFILE':
        return <WorkerProfile 
          worker={view.worker} 
          onBack={() => setView({ screen: 'USER_DASHBOARD' })}
          onContact={handleContact}
          onBookNow={handleBookNow} 
          t={t}
        />;
      case 'BOOKING':
        return <BookingScreen 
          worker={view.worker} 
          user={currentUser as User}
          allJobRequests={jobRequests}
          onBack={() => setView({ screen: 'WORKER_PROFILE', worker: view.worker })} 
          onSubmit={handleBookingSubmit}
          t={t}
        />;
       case 'LEAVE_REVIEW':
         const workerForReview = workers.find(w => w.id === view.job.workerId);
         if (!workerForReview) return <div>Worker not found</div>;
         return <LeaveReviewScreen
            job={view.job}
            worker={workerForReview}
            onBack={() => setView({ screen: 'MY_JOBS' })}
            onSubmit={handleUserReviewSubmit}
            t={t}
         />
      case 'LEAVE_REVIEW_FOR_USER':
         return <LeaveReviewForUserScreen
            job={view.job}
            user={view.job.user}
            onBack={() => setView({ screen: 'WORKER_DASHBOARD' })}
            onSubmit={handleWorkerReviewSubmit}
            t={t}
         />
      case 'WORKER_DASHBOARD':
        return <WorkerDashboard 
          worker={currentUser as Worker} 
          jobRequests={jobRequests.filter(j => j.workerId === currentUser?.id)}
          invoices={invoices}
          onSelectJob={(job) => setView({ screen: 'JOB_DETAILS', job })}
          onEditProfile={() => setView({ screen: 'WORKER_PROFILE_EDIT' })}
          onContactClient={handleContact}
          onRaiseDispute={(job) => setView({ screen: 'RAISE_DISPUTE', job })}
          onViewDispute={(disputeId) => setView({ screen: 'DISPUTE_DETAILS', disputeId })}
          t={t}
        />;
      case 'JOB_DETAILS':
        const clientUser = users.find(u => u.id === view.job.user.id);
        const jobInvoice = invoices.find(i => i.jobId === view.job.id);
        return <JobRequestDetails
            job={view.job}
            invoice={jobInvoice}
            client={clientUser || view.job.user} // Use updated user data if available
            worker={currentUser as Worker}
            onBack={() => setView({ screen: 'WORKER_DASHBOARD' })}
            onContactClient={handleContact}
            onUpdateStatus={handleUpdateJobStatus}
            onCancelJob={handleCancelJob}
            onLeaveReview={handleLeaveWorkerReview}
            onCreateInvoice={(job) => setView({ screen: 'CREATE_INVOICE', job })}
            onViewClientProfile={handleViewClientProfile}
            t={t}
        />
      case 'WORKER_PROFILE_EDIT':
        return <WorkerProfileEdit
            worker={currentUser as Worker}
            onSave={handleSaveWorkerProfile}
            onBack={() => setView({ screen: 'WORKER_DASHBOARD' })}
            t={t}
            language={language}
        />
      case 'USER_PROFILE_EDIT':
        return <UserProfileEdit
            user={currentUser as User}
            onSave={handleSaveUserProfile}
            onBack={() => setView({ screen: 'USER_DASHBOARD' })}
            t={t}
        />
      case 'MESSAGING': {
        const otherParticipantId = view.conversationId.replace('conv_', '').replace(currentUser!.id, '').replace('_', '');
        const allUsersAndWorkers = [...users, ...workers, {id: ADMIN_ID, name: 'Support', avatarUrl: 'https://picsum.photos/seed/admin/200'}];
        const otherParticipant = allUsersAndWorkers.find(p => p.id === otherParticipantId);
        if(!otherParticipant) return <div>Participant not found.</div>;
        return <MessagingScreen
            currentUser={currentUser as User | Worker}
            otherParticipant={otherParticipant as User | Worker}
            messages={messages.filter(m => (m.senderId === currentUser!.id && m.receiverId === otherParticipant.id) || (m.senderId === otherParticipant.id && m.receiverId === currentUser!.id))}
            invoices={invoices}
            onSendMessage={handleSendMessage}
            onPayInvoice={handlePayInvoice}
            onMarkAsRead={handleMarkMessagesAsRead}
            onViewProfile={handleViewParticipantProfile}
            onBack={() => {
              if(userType === 'admin') setView({ screen: 'ADMIN_DASHBOARD' });
              else setView({ screen: 'CONVERSATIONS' });
            }}
            t={t}
        />
      }
      case 'CONVERSATIONS':
         const userConversations = Array.from(new Set(messages.filter(m => m.senderId === currentUser!.id || m.receiverId === currentUser!.id).map(m => `conv_${[m.senderId, m.receiverId].sort().join('_')}`)));
         const allUsersAndWorkersForConvo = [...users, ...workers, {id: ADMIN_ID, name: 'TUFIX Support', avatarUrl: 'https://picsum.photos/seed/admin/200'}];
         const conversations: Conversation[] = userConversations.map(convId => {
            const participantIds = convId.replace('conv_', '').split('_');
            const participantA = allUsersAndWorkersForConvo.find(p => p.id === participantIds[0])! as User | Worker;
            const participantB = allUsersAndWorkersForConvo.find(p => p.id === participantIds[1])! as User | Worker;
            const lastMessage = messages.filter(m => (m.senderId === participantA.id && m.receiverId === participantB.id) || (m.senderId === participantB.id && m.receiverId === participantA.id)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            return { id: convId, participantA, participantB, lastMessage };
         }).filter(c => c.participantA && c.participantB && c.lastMessage);

        return <ConversationsScreen
            currentUser={currentUser!}
            conversations={conversations}
            onSelectConversation={(conv) => setView({ screen: 'MESSAGING', conversationId: conv.id })}
            onBack={() => userType === 'user' ? setView({screen: 'USER_DASHBOARD'}) : setView({screen: 'WORKER_DASHBOARD'})}
            t={t}
        />
      case 'ADMIN_DASHBOARD':
        const usersWithUpdatedData = users.map(u => {
            const jobData = jobRequests.filter(j => j.user.id === u.id);
            const reviewsFromWorkers = jobData.map(j => j.workerReview).filter((r): r is Review => !!r);
            return { ...u, reviews: reviewsFromWorkers };
        });
        const pendingWorkers = workers.filter(w => w.verificationStatus === 'pending');
        return <AdminDashboard 
            users={usersWithUpdatedData} 
            workers={workers} 
            allJobs={jobRequests}
            transactions={transactions}
            disputes={disputes}
            notifications={notifications}
            messages={messages}
            pendingVerifications={pendingWorkers}
            onSelectUser={(user) => setView({ screen: 'ADMIN_CLIENT_PROFILE', user })}
            onSelectWorker={(worker) => setView({ screen: 'ADMIN_WORKER_PROFILE', worker })}
            onSelectDispute={(dispute) => setView({ screen: 'ADMIN_DISPUTE_DETAILS', dispute })}
            onSelectSupportConversation={(conversationId) => setView({ screen: 'MESSAGING', conversationId })}
            onSelectVerification={(worker) => setView({ screen: 'ADMIN_WORKER_VERIFICATION', worker })}
            onEditTerms={() => setView({ screen: 'ADMIN_EDIT_TERMS' })}
            onClearAllData={handleClearAllData}
            t={t}
            adminId={currentAdminId}
        />
      case 'ADMIN_CLIENT_PROFILE':
        return <ClientProfileAdminView
            user={view.user}
            jobs={jobRequests.filter(j => j.user.id === view.user.id)}
            workers={workers}
            messages={messages}
            onViewConversation={handleAdminViewConversation}
            onBack={() => setView({ screen: 'ADMIN_DASHBOARD' })}
            t={t}
        />
      case 'ADMIN_WORKER_PROFILE':
        return <WorkerProfileAdminView
            worker={view.worker}
            jobs={jobRequests.filter(j => j.workerId === view.worker.id)}
            users={users}
            messages={messages}
            onViewConversation={handleAdminViewConversation}
            onBack={() => setView({ screen: 'ADMIN_DASHBOARD' })}
            t={t}
        />
      case 'ADMIN_WORKER_VERIFICATION':
          return <AdminWorkerVerificationScreen
              worker={view.worker}
              onApprove={handleApproveWorker}
              onDecline={handleDeclineWorker}
              onBack={() => setView({ screen: 'ADMIN_DASHBOARD' })}
              t={t}
          />
      case 'ADMIN_MESSAGING': {
        const participantIds = view.conversationId.replace('conv_', '').split('_');
        const allUsersAndWorkersList = [...users, ...workers];
        const participant1 = allUsersAndWorkersList.find(p => p.id === participantIds[0]);
        const participant2 = allUsersAndWorkersList.find(p => p.id === participantIds[1]);
        if (!participant1 || !participant2) return <div>Conversation not found.</div>;

        return <MessagingScreen
            currentUser={participant1}
            otherParticipant={participant2}
            messages={messages.filter(m => (m.senderId === participant1.id && m.receiverId === participant2.id) || (m.senderId === participant2.id && m.receiverId === participant1.id))}
            invoices={invoices}
            onSendMessage={() => {}}
            onPayInvoice={() => {}}
            onMarkAsRead={() => {}}
            onViewProfile={handleViewParticipantProfile}
            onBack={() => setView({ screen: 'ADMIN_DASHBOARD' })}
            isReadOnly={true}
            t={t}
        />
      }
      case 'EARNINGS':
        return <EarningsScreen
          worker={currentUser as Worker}
          jobRequests={jobRequests.filter(j => j.workerId === currentUser?.id)}
          onBack={() => setView({ screen: 'WORKER_DASHBOARD' })}
          t={t}
          language={language}
        />
      case 'MY_JOBS':
        return <MyJobsScreen
          jobRequests={jobRequests.filter(j => j.user.id === currentUser?.id)}
          invoices={invoices}
          onLeaveReview={handleLeaveUserReview}
          onCancelJob={handleCancelJob}
          onBack={() => setView({ screen: 'USER_DASHBOARD' })}
          onPayInvoice={handlePayInvoice}
          onConfirmAndReleasePayment={handleConfirmAndReleasePayment}
          onRaiseDispute={(job) => setView({ screen: 'RAISE_DISPUTE', job })}
          onViewDispute={(disputeId) => setView({ screen: 'DISPUTE_DETAILS', disputeId })}
          t={t}
        />
      case 'CREATE_INVOICE':
        return <CreateJobInvoice
          job={view.job}
          worker={currentUser as Worker}
          onBack={() => setView({ screen: 'JOB_DETAILS', job: view.job })}
          onSubmit={handleCreateAndSendInvoice}
          t={t}
        />
      case 'RAISE_DISPUTE':
        return <RaiseDisputeScreen
            job={view.job}
            onBack={() => userType === 'user' ? setView({ screen: 'MY_JOBS' }) : setView({ screen: 'WORKER_DASHBOARD' })}
            onSubmit={handleRaiseDispute}
            t={t}
        />
      case 'DISPUTE_DETAILS': {
        const dispute = disputes.find(d => d.id === view.disputeId);
        if (!dispute) return <div>Dispute not found.</div>;
        const job = jobRequests.find(j => j.id === dispute.jobId);
        if (!job) return <div>Associated job not found.</div>;
        return <DisputeDetailsScreen
            dispute={dispute}
            job={job}
            currentUser={currentUser!}
            onBack={() => userType === 'user' ? setView({ screen: 'MY_JOBS' }) : setView({ screen: 'WORKER_DASHBOARD' })}
            t={t}
        />
      }
      case 'ADMIN_DISPUTE_DETAILS': {
        const job = jobRequests.find(j => j.id === view.dispute.jobId);
        const client = users.find(u => u.id === job?.user.id);
        const worker = workers.find(w => w.id === job?.workerId);
        const invoice = invoices.find(i => i.id === job?.invoiceId);
        if (!job || !client || !worker || !invoice) return <div>Dispute data incomplete.</div>;

        return <AdminDisputeResolutionScreen 
            dispute={view.dispute}
            job={job}
            client={client}
            worker={worker}
            invoice={invoice}
            onBack={() => setView({ screen: 'ADMIN_DASHBOARD' })}
            onSendMessage={handleAdminSendDisputeMessage}
            onResolve={handleAdminResolveDispute}
            t={t}
        />
      }
      case 'ADMIN_EDIT_TERMS':
        return <AdminTermsEditScreen
            initialContent={termsContent}
            onSave={handleSaveTerms}
            onBack={() => setView({ screen: 'ADMIN_DASHBOARD' })}
            t={t}
        />
       case 'CLIENT_PROFILE_VIEW_BY_WORKER':
        return <ClientProfileForWorkerView
            client={view.user}
            onBack={() => setView({ screen: 'JOB_DETAILS', job: view.fromJob })}
            t={t}
        />
      case 'NOTIFICATIONS':
        return (
          <NotificationsScreen 
            notifications={notifications.filter(n => n.userId === currentUser?.id)}
            onNotificationClick={(notif) => {
              if (notif.type === 'new_message') setView({ screen: 'CONVERSATIONS' });
              else if (notif.type === 'new_job' || notif.type === 'status_update') {
                  if (userType === 'worker') setView({ screen: 'WORKER_DASHBOARD' });
                  else setView({ screen: 'MY_JOBS' });
              }
              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            }}
            onMarkAllAsRead={() => setNotifications(prev => prev.map(n => n.userId === currentUser?.id ? { ...n, isRead: true } : n))}
            t={t}
          />
        );
      default:
        return <div>{t('not_found')}</div>;
    }
  };

  return (
    <div className="min-h-screen font-sans bg-white text-black">
      <Header
        user={currentUser}
        userType={userType}
        onLogout={handleLogout}
        notifications={notifications.filter(n => n.userId === currentUser?.id)}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNavigate={(screen) => {
            if (screen === 'dashboard') {
                if(userType === 'user') setView({ screen: 'USER_DASHBOARD' });
                else if(userType === 'worker') setView({ screen: 'WORKER_DASHBOARD' });
                else if(userType === 'admin') setView({ screen: 'ADMIN_DASHBOARD' });
            }
        }}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      <main className={view.screen === 'AUTH' ? "flex flex-col justify-center min-h-[calc(100dvh-64px)] p-4 sm:p-6 lg:p-8" : "p-4 sm:p-6 lg:p-8 pt-24 pb-24 sm:pb-8"}>
        {renderContent()}
      </main>
      <BottomNavigation 
        userType={userType}
        activeScreen={view.screen}
        unreadNotificationsCount={unreadNotificationsCount}
        onNavigate={(screen) => {
            if (screen === 'messages') setView({ screen: 'CONVERSATIONS' });
            else if (screen === 'profile') {
                if (userType === 'worker') setView({ screen: 'WORKER_PROFILE_EDIT' });
                else if (userType === 'user') setView({ screen: 'USER_PROFILE_EDIT' });
            }
            else if (screen === 'earnings') setView({ screen: 'EARNINGS' });
            else if (screen === 'my-jobs') setView({ screen: 'MY_JOBS' });
            else if (screen === 'job-requests') {
                if(userType === 'user') setView({ screen: 'USER_DASHBOARD' });
                else if(userType === 'worker') setView({ screen: 'WORKER_DASHBOARD' });
            }
            else if (screen === 'notifications') setView({ screen: 'NOTIFICATIONS' });
        }}
        t={t}
      />
      {currentUser && userType !== 'admin' && <AiSupportBubble t={t} onRequestHumanSupport={handleRequestHumanSupport} currentUser={currentUser} userType={userType} jobRequests={jobRequests} transactions={transactions} />}
    </div>
  );
};

export default App;