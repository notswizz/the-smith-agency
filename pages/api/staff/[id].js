import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import twilio from 'twilio';

// Twilio credentials from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Basic formatter to E.164 (+1 for 10-digit US numbers)
function formatToE164(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    // Assume already E.164-ish
    return digits;
  }
  // If 11+ digits, assume already includes country code without plus
  if (digits.length > 10) {
    return `+${digits}`;
  }
  // If 10 digits, default to US country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return null;
}

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Staff ID is required' });
  }

  const staffRef = doc(db, 'staff', id);

  switch (method) {
    case 'GET':
      try {
        const staffDoc = await getDoc(staffRef);
        
        if (!staffDoc.exists()) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        
        res.status(200).json({
          id: staffDoc.id,
          ...staffDoc.data()
        });
      } catch (error) {
        console.error('Error fetching staff member:', error);
        res.status(500).json({ error: 'Failed to fetch staff member' });
      }
      break;
      
    case 'PUT':
      try {
        const staffDoc = await getDoc(staffRef);
        
        if (!staffDoc.exists()) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        
        const previousData = staffDoc.data() || {};
        
        const updatedStaff = {
          ...req.body,
          updatedAt: serverTimestamp()
        };
        
        // Detect application approval transition (false -> true)
        const applicationJustApproved = Boolean(
          !previousData.applicationFormApproved && updatedStaff.applicationFormApproved
        );
        
        await updateDoc(staffRef, updatedStaff);
        
        // Fire-and-forget SMS notifications (do not block response)
        (async () => {
          try {
            // Only proceed if we have something to notify and Twilio is configured
            if (!applicationJustApproved) return;
            if (!accountSid || !authToken || !twilioPhoneNumber) {
              console.warn('Twilio not configured; skipping SMS notifications');
              return;
            }
            
            const client = twilio(accountSid, authToken);
            const staffName = updatedStaff.name || previousData.name || 'there';
            const rawPhone = updatedStaff.phone || previousData.phone || updatedStaff.phoneNumber || previousData.phoneNumber;
            const to = formatToE164(rawPhone);
            if (!to) {
              console.warn(`No valid phone number for staff ${id}; skipping SMS.`);
              return;
            }
            
            // Application approved notification
            if (applicationJustApproved) {
              const appMsg = `Hi ${staffName}, your application has been approved! You can now log in to your staff portal to view shows and share availability.`;
              await client.messages.create({ body: appMsg, from: twilioPhoneNumber, to });
            }
          } catch (notifyErr) {
            console.error('Error sending approval SMS notification:', notifyErr);
          }
        })();
        
        res.status(200).json({
          id,
          ...updatedStaff
        });
      } catch (error) {
        console.error('Error updating staff member:', error);
        res.status(500).json({ error: 'Failed to update staff member' });
      }
      break;
      
    case 'DELETE':
      try {
        const staffDoc = await getDoc(staffRef);
        
        if (!staffDoc.exists()) {
          return res.status(404).json({ error: 'Staff member not found' });
        }
        
        await deleteDoc(staffRef);
        
        res.status(200).json({ message: 'Staff member deleted successfully' });
      } catch (error) {
        console.error('Error deleting staff member:', error);
        res.status(500).json({ error: 'Failed to delete staff member' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 