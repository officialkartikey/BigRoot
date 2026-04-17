// 🎓 List of allowed colleges
const COLLEGES = [
  "Ajay Kumar Garg Engineering College",
  "KIET Group of Institutions",
  "IMS Engineering College",
  "ABES Engineering College",
  "ABES Institute of Technology",
  "SRM Institute of Science and Technology (Delhi-NCR Campus)",
  "NITRA Technical Campus",
  "HRIT Group of Institutions",
  "Amity University Noida",
  "Jaypee Institute of Information Technology",
  "JSS Academy of Technical Education",
  "Maharishi University of Information Technology",
  "Symbiosis International University (Noida Campus)",
  "Galgotias University",
  "Galgotias College of Engineering and Technology",
  "GL Bajaj Institute of Technology and Management",
  "Noida Institute of Engineering and Technology",
  "Sharda University",
  "Greater Noida Institute of Technology",
  "Dronacharya College of Engineering",
  "ITS Engineering College",
  "Gautam Buddha University",
  "Delhi Technological University",
  "Netaji Subhas University of Technology",
  "Indira Gandhi Delhi Technical University for Women",
  "Jamia Millia Islamia",
  "University of Delhi",
  "Guru Gobind Singh Indraprastha University",
  "Indian Institute of Technology Delhi"
];

// 👤 Roles
const ROLES = {
  ADMIN: "admin",
  STUDENT: "student",
  FACULTY: "faculty",
};

// 📌 Export everything
module.exports = {
  COLLEGES,
  ROLES,
};
const DOMAINS = {
  technical: {
    software: [
      "Web Development","App Development","Machine Learning","Artificial Intelligence",
      "Data Science","Cyber Security","Cloud Computing","Blockchain","Game Development",
      "DevOps","UI/UX Design","Competitive Programming"
    ],
    hardware: [
      "Robotics","Embedded Systems","IoT (Internet of Things)","VLSI Design",
      "Drone Technology","Arduino Projects","Raspberry Pi","Electronics Circuits","Automation Systems"
    ]
  },
  cultural: [
    "Dance","Singing","Music Instrument","Drama / Theatre","Photography","Videography",
    "Content Creation","Public Speaking","Debate","Poetry","Creative Writing",
    "Anchoring","Event Management","Stand-up Comedy","Fashion / Modeling"
  ],
  sports: [
    "Cricket","Football","Badminton","Basketball","Volleyball","Table Tennis",
    "Chess","Athletics","Kabaddi","Gym / Fitness","Yoga"
  ],
  other: [
    "Entrepreneurship","Startup Enthusiast","Social Work","NGO Activities",
    "Leadership","Management","Marketing","Finance","Stock Market"
  ]
};

// Flatten for enum
const DOMAIN_LIST = [
  ...DOMAINS.technical.software,
  ...DOMAINS.technical.hardware,
  ...DOMAINS.cultural,
  ...DOMAINS.sports,
  ...DOMAINS.other
];

module.exports = { DOMAINS, DOMAIN_LIST };