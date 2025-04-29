const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, deleteDoc, getDocs } = require('firebase/firestore');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1I_hYoiuc-IEMNwaSss41CD7jnaEpy7Q",
  authDomain: "the-smith-agency.firebaseapp.com",
  projectId: "the-smith-agency",
  storageBucket: "the-smith-agency.firebasestorage.app",
  messagingSenderId: "1048512215721",
  appId: "1:1048512215721:web:c092a7c008d61c4c7d47b8",
  measurementId: "G-QTTX3YDDMP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data
const clients = [
  {
    name: 'Bedhead Productions',
    email: 'contact@bedheadprod.com',
    phone: '(404) 555-0128',
    address: '742 Broadway, Atlanta, GA 30308',
    type: 'production',
    status: 'active',
    contacts: [
      {
        name: 'James Wilson',
        email: 'james@bedheadprod.com',
        phone: '(404) 555-0129',
        role: 'Production Director',
        isPrimary: true
      },
      {
        name: 'Lisa Chen',
        email: 'lisa@bedheadprod.com',
        phone: '(404) 555-0130',
        role: 'Event Coordinator',
        isPrimary: false
      }
    ]
  },
  {
    name: 'Lilypod Events',
    email: 'bookings@lilypod.events',
    phone: '(214) 555-0193',
    address: '1234 Main St, Dallas, TX 75201',
    type: 'events',
    status: 'active',
    contacts: [
      {
        name: 'Maria Rodriguez',
        email: 'maria@lilypod.events',
        phone: '(214) 555-0194',
        role: 'Events Manager',
        isPrimary: true
      }
    ]
  },
  {
    name: 'Starlight Media',
    email: 'info@starlightmedia.com',
    phone: '(310) 555-0147',
    address: '8721 Sunset Blvd, Los Angeles, CA 90069',
    type: 'media',
    status: 'active',
    contacts: [
      {
        name: 'David Park',
        email: 'david@starlightmedia.com',
        phone: '(310) 555-0148',
        role: 'Media Director',
        isPrimary: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@starlightmedia.com',
        phone: '(310) 555-0149',
        role: 'Production Coordinator',
        isPrimary: false
      }
    ]
  }
];

const staff = [
  {
    firstName: 'John',
    lastName: 'Martinez',
    email: 'john.m@smithagency.com',
    phone: '(404) 555-0101',
    role: 'Production Manager',
    status: 'active',
    skills: ['lighting', 'sound', 'stage management'],
    availability: 'full-time',
    sizes: {
      height: "6'0\"",
      chest: '42"',
      waist: '34"',
      inseam: '32"',
      shoe: '10.5'
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.c@smithagency.com',
    phone: '(404) 555-0102',
    role: 'Technical Director',
    status: 'active',
    skills: ['rigging', 'safety', 'equipment'],
    availability: 'full-time',
    sizes: {
      height: "5'6\"",
      bust: '36"',
      waist: '28"',
      hips: '38"',
      dress: '6',
      shoe: '7.5'
    }
  },
  {
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@smithagency.com',
    phone: '(404) 555-0103',
    role: 'Sound Engineer',
    status: 'active',
    skills: ['audio mixing', 'live sound', 'recording'],
    availability: 'contract',
    sizes: {
      height: "5'11\"",
      chest: '40"',
      waist: '32"',
      inseam: '30"',
      shoe: '9'
    }
  },
  {
    firstName: 'Emily',
    lastName: 'Williams',
    email: 'emily.w@smithagency.com',
    phone: '(404) 555-0104',
    role: 'Lighting Designer',
    status: 'active',
    skills: ['lighting design', 'programming', 'operation'],
    availability: 'contract',
    sizes: {
      height: "5'7\"",
      bust: '34"',
      waist: '27"',
      hips: '37"',
      dress: '4',
      shoe: '8'
    }
  }
];

const shows = [
  {
    name: 'ATL Spring Gift 2025',
    client: 'Bedhead Productions',
    location: 'Georgia World Congress Center',
    startDate: '2025-03-15',
    endDate: '2025-03-20',
    type: 'trade show',
    status: 'confirmed',
    requirements: {
      lighting: true,
      sound: true,
      staging: true,
      staff: 4
    }
  },
  {
    name: 'DAL Winter Bridal 2025',
    client: 'Lilypod Events',
    location: 'Kay Bailey Hutchison Convention Center',
    startDate: '2025-01-10',
    endDate: '2025-01-12',
    type: 'exhibition',
    status: 'confirmed',
    requirements: {
      lighting: true,
      sound: true,
      staging: false,
      staff: 2
    }
  },
  {
    name: 'LA Summer Tech Expo 2024',
    client: 'Starlight Media',
    location: 'Los Angeles Convention Center',
    startDate: '2024-07-15',
    endDate: '2024-07-18',
    type: 'trade show',
    status: 'pending',
    requirements: {
      lighting: true,
      sound: true,
      staging: true,
      staff: 6
    }
  }
];

// Helper function to generate dates between start and end
const generateDatesBetween = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Generate bookings based on shows and staff
const generateBookings = (shows, staff, clients) => {
  return shows.map(show => {
    const client = clients.find(c => c.name === show.client);
    const dates = generateDatesBetween(show.startDate, show.endDate);
    const requiredStaff = show.requirements.staff;
    
    // Randomly assign staff to dates
    const datesNeeded = dates.map(date => {
      const shuffledStaff = [...staff].sort(() => 0.5 - Math.random());
      const assignedStaff = shuffledStaff.slice(0, requiredStaff);
      
      return {
        date: date.toISOString().split('T')[0],
        staffCount: requiredStaff,
        staffIds: assignedStaff.map(s => s.id)
      };
    });

    return {
      clientId: client?.id,
      showId: show.id,
      status: show.status,
      datesNeeded,
      notes: `${show.type.charAt(0).toUpperCase() + show.type.slice(1)} setup and operation.\nLocation: ${show.location}\nRequirements: ${Object.entries(show.requirements)
        .filter(([key, value]) => value === true)
        .map(([key]) => key)
        .join(', ')}`,
      assignedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
};

// Function to clear existing data
async function clearCollection(collectionName) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const deletePromises = [];
  querySnapshot.forEach((doc) => {
    deletePromises.push(deleteDoc(doc.ref));
  });
  await Promise.all(deletePromises);
  console.log(`Cleared ${collectionName} collection`);
}

// Main seed function
async function seedDatabase() {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await clearCollection('clients');
    await clearCollection('staff');
    await clearCollection('shows');
    await clearCollection('bookings');

    console.log('Adding clients...');
    for (const client of clients) {
      await addDoc(collection(db, 'clients'), client);
    }

    console.log('Adding staff...');
    for (const member of staff) {
      await addDoc(collection(db, 'staff'), member);
    }

    console.log('Adding shows...');
    for (const show of shows) {
      // Find client reference
      const clientDoc = await getDocs(collection(db, 'clients'));
      const clientRef = clientDoc.docs.find(doc => doc.data().name === show.client);
      if (clientRef) {
        await addDoc(collection(db, 'shows'), {
          ...show,
          clientId: clientRef.id
        });
      }
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase(); 