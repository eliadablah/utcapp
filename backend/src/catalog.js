/*
  The portal's fixed lists: document types, labs, time slots, support
  categories, the course catalog and the limits the API enforces.
  The website downloads this from /api/bootstrap, so the server is the one
  place these are defined when the API is running.
*/
export const portalConfig = {
  maxCredits: 18,
  maxUploadBytes: 10 * 1024 * 1024,

  documentTypes: [
    { id: "photo-id", label: "Photo ID", required: true },
    { id: "transcript", label: "Official transcript", required: true },
    { id: "immunization", label: "Immunization record", required: true },
    { id: "other", label: "Other document", required: false },
  ],

  labs: [
    { id: "cloud", label: "Cloud Computing Lab (Room 210)" },
    { id: "network", label: "Networking Lab (Room 114)" },
    { id: "security", label: "Cybersecurity Lab (Room 305)" },
    { id: "open", label: "Open Computer Lab (Library)" },
  ],

  slots: ["9:00 AM - 11:00 AM", "11:00 AM - 1:00 PM", "1:00 PM - 3:00 PM", "3:00 PM - 5:00 PM", "6:00 PM - 8:00 PM"],

  categories: ["Account and login", "Enrollment", "Documents", "Lab access", "Courses", "Something else"],
  priorities: ["Normal", "High"],

  catalog: [
    { id: "cld101", code: "CLD 101", title: "Introduction to Cloud Computing", dept: "Cloud", instructor: "Dr. A. Mensah", schedule: "Mon / Wed 9:00 AM", location: "Room 210", credits: 3 },
    { id: "cld220", code: "CLD 220", title: "Infrastructure as Code", dept: "Cloud", instructor: "Prof. L. Ortiz", schedule: "Tue / Thu 1:00 PM", location: "Room 210", credits: 4 },
    { id: "cld310", code: "CLD 310", title: "Highly Available Architectures", dept: "Cloud", instructor: "Dr. A. Mensah", schedule: "Fri 10:00 AM", location: "Room 212", credits: 3 },
    { id: "net150", code: "NET 150", title: "Networking Fundamentals", dept: "Networking", instructor: "Prof. R. Okafor", schedule: "Mon / Wed 1:00 PM", location: "Room 114", credits: 3 },
    { id: "net260", code: "NET 260", title: "Routing and Load Balancing", dept: "Networking", instructor: "Prof. R. Okafor", schedule: "Tue / Thu 9:00 AM", location: "Room 114", credits: 3 },
    { id: "sec200", code: "SEC 200", title: "Security Essentials", dept: "Security", instructor: "Dr. M. Haddad", schedule: "Tue / Thu 3:00 PM", location: "Room 305", credits: 3 },
    { id: "sec330", code: "SEC 330", title: "Identity and Access Management", dept: "Security", instructor: "Dr. M. Haddad", schedule: "Wed 6:00 PM", location: "Room 305", credits: 3 },
    { id: "dba240", code: "DBA 240", title: "Relational Databases", dept: "Data", instructor: "Prof. S. Nguyen", schedule: "Mon / Wed 3:00 PM", location: "Room 118", credits: 4 },
    { id: "ops280", code: "OPS 280", title: "Monitoring and Operations", dept: "Operations", instructor: "Prof. J. Baptiste", schedule: "Thu 6:00 PM", location: "Room 212", credits: 2 },
  ],
};

// How many of each thing one visitor may have, so nobody can fill the database
export const limits = { documents: 20, labRequests: 50, tickets: 50 };

// Upload types the API accepts, with the first bytes each real file starts with
export const uploadTypes = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
};
