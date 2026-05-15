import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { CalendarEvent } from '../types';

export async function createGoogleCalendarEvent(blueprintId: string, eventDetails: {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
}) {
  if (!auth.currentUser) throw new Error('Anda harus masuk terlebih dahulu.');

  // 1. Get access token with scope
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar.events');
  
  // Suggesting to the user that a popup will appear
  console.log('Requesting Google Calendar permissions...');
  
  // Re-authenticating to ensure we have the token with correct scope
  // If the user already has session, this might be fast
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;

  if (!token) {
    throw new Error('Gagal mendapatkan izin akses Google Calendar. Pastikan Anda memberikan izin saat diminta.');
  }

  // 2. Create event in Google Calendar
  const startTimeISO = new Date(eventDetails.startTime).toISOString();
  const endTimeISO = new Date(eventDetails.endTime).toISOString();

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: eventDetails.title,
      description: eventDetails.description,
      location: eventDetails.location,
      start: {
        dateTime: startTimeISO
      },
      end: {
        dateTime: endTimeISO
      },
      reminders: {
        useDefault: true
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Calendar API Error:', errorData);
    
    if (errorData.error?.message?.includes('API has not been used')) {
      throw new Error('Google Calendar API belum diaktifkan di project ini. Silakan hubungi admin.');
    }
    
    throw new Error(errorData.error?.message || 'Gagal membuat event di Google Calendar.');
  }

  const googleEvent = await response.json();

  // 3. Save to Firestore
  const eventData = {
    googleEventId: googleEvent.id,
    title: eventDetails.title,
    description: eventDetails.description,
    startTime: eventDetails.startTime,
    endTime: eventDetails.endTime,
    blueprintId: blueprintId,
    creatorId: auth.currentUser.uid,
    htmlLink: googleEvent.htmlLink,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'blueprints', blueprintId, 'calendar_events'), eventData);

  return { id: docRef.id, ...eventData, htmlLink: googleEvent.htmlLink };
}

export async function getCalendarEventsForBlueprint(blueprintId: string): Promise<CalendarEvent[]> {
  const eventsColl = collection(db, 'blueprints', blueprintId, 'calendar_events');
  const q = query(eventsColl, orderBy('createdAt', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as CalendarEvent));
}
