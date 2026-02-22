export interface Institution {
  id: string;
  name: string;
  fullName: string;
  country: string;
  type: 'university' | 'college' | 'school';
}

export const COUNTRIES = [
  'Pakistan', 'India', 'United States', 'United Kingdom',
] as const;

export type Country = typeof COUNTRIES[number];

export const INSTITUTIONS: Institution[] = [
  // Pakistan - Universities
  { id: 'nust', name: 'NUST', fullName: 'National University of Sciences & Technology', country: 'Pakistan', type: 'university' },
  { id: 'fast', name: 'FAST', fullName: 'FAST National University', country: 'Pakistan', type: 'university' },
  { id: 'pu', name: 'Punjab University', fullName: 'University of the Punjab', country: 'Pakistan', type: 'university' },
  { id: 'ucp', name: 'UCP', fullName: 'University of Central Punjab', country: 'Pakistan', type: 'university' },
  { id: 'comsats', name: 'COMSATS', fullName: 'COMSATS University Islamabad', country: 'Pakistan', type: 'university' },
  { id: 'giki', name: 'GIKI', fullName: 'Ghulam Ishaq Khan Institute', country: 'Pakistan', type: 'university' },
  { id: 'lums', name: 'LUMS', fullName: 'Lahore University of Management Sciences', country: 'Pakistan', type: 'university' },
  { id: 'aku', name: 'AKU', fullName: 'Aga Khan University', country: 'Pakistan', type: 'university' },
  { id: 'iiu', name: 'IIUI', fullName: 'International Islamic University Islamabad', country: 'Pakistan', type: 'university' },
  { id: 'quaid', name: 'QAU', fullName: 'Quaid-i-Azam University', country: 'Pakistan', type: 'university' },
  { id: 'uet_lhr', name: 'UET Lahore', fullName: 'University of Engineering & Technology Lahore', country: 'Pakistan', type: 'university' },
  { id: 'uet_pwr', name: 'UET Peshawar', fullName: 'University of Engineering & Technology Peshawar', country: 'Pakistan', type: 'university' },
  { id: 'ned', name: 'NED', fullName: 'NED University of Engineering & Technology', country: 'Pakistan', type: 'university' },
  { id: 'uol', name: 'UoL', fullName: 'University of Lahore', country: 'Pakistan', type: 'university' },
  { id: 'bzu', name: 'BZU', fullName: 'Bahauddin Zakariya University', country: 'Pakistan', type: 'university' },
  { id: 'uos', name: 'UoS', fullName: 'University of Sargodha', country: 'Pakistan', type: 'university' },
  { id: 'iub', name: 'IUB', fullName: 'Islamia University Bahawalpur', country: 'Pakistan', type: 'university' },
  { id: 'su', name: 'SU', fullName: 'University of Sindh', country: 'Pakistan', type: 'university' },
  { id: 'uob', name: 'UoB', fullName: 'University of Balochistan', country: 'Pakistan', type: 'university' },
  { id: 'numl', name: 'NUML', fullName: 'National University of Modern Languages', country: 'Pakistan', type: 'university' },
  { id: 'au', name: 'Air University', fullName: 'Air University Islamabad', country: 'Pakistan', type: 'university' },
  { id: 'bahria', name: 'Bahria', fullName: 'Bahria University', country: 'Pakistan', type: 'university' },
  { id: 'riphah', name: 'Riphah', fullName: 'Riphah International University', country: 'Pakistan', type: 'university' },
  { id: 'gift', name: 'GIFT', fullName: 'GIFT University Gujranwala', country: 'Pakistan', type: 'university' },
  { id: 'superior', name: 'Superior', fullName: 'Superior University Lahore', country: 'Pakistan', type: 'university' },
  { id: 'minhaj', name: 'Minhaj', fullName: 'Minhaj University Lahore', country: 'Pakistan', type: 'university' },
  // Pakistan - Colleges
  { id: 'gc_lhr', name: 'GCU Lahore', fullName: 'Government College University Lahore', country: 'Pakistan', type: 'college' },
  { id: 'gc_fsd', name: 'GCUF', fullName: 'Government College University Faisalabad', country: 'Pakistan', type: 'college' },
  { id: 'fc_lhr', name: 'FC College', fullName: 'Forman Christian College Lahore', country: 'Pakistan', type: 'college' },
  { id: 'kinnaird', name: 'Kinnaird', fullName: 'Kinnaird College for Women', country: 'Pakistan', type: 'college' },
  { id: 'aitchison', name: 'Aitchison', fullName: 'Aitchison College Lahore', country: 'Pakistan', type: 'college' },

  // India - Universities
  { id: 'iitd', name: 'IIT Delhi', fullName: 'Indian Institute of Technology Delhi', country: 'India', type: 'university' },
  { id: 'iitb', name: 'IIT Bombay', fullName: 'Indian Institute of Technology Bombay', country: 'India', type: 'university' },
  { id: 'iitm', name: 'IIT Madras', fullName: 'Indian Institute of Technology Madras', country: 'India', type: 'university' },
  { id: 'iitk', name: 'IIT Kanpur', fullName: 'Indian Institute of Technology Kanpur', country: 'India', type: 'university' },
  { id: 'iitkgp', name: 'IIT Kharagpur', fullName: 'Indian Institute of Technology Kharagpur', country: 'India', type: 'university' },
  { id: 'du', name: 'Delhi University', fullName: 'University of Delhi', country: 'India', type: 'university' },
  { id: 'jnu', name: 'JNU', fullName: 'Jawaharlal Nehru University', country: 'India', type: 'university' },
  { id: 'bhu', name: 'BHU', fullName: 'Banaras Hindu University', country: 'India', type: 'university' },
  { id: 'amu', name: 'AMU', fullName: 'Aligarh Muslim University', country: 'India', type: 'university' },
  { id: 'bits', name: 'BITS Pilani', fullName: 'Birla Institute of Technology and Science', country: 'India', type: 'university' },
  { id: 'vit', name: 'VIT', fullName: 'Vellore Institute of Technology', country: 'India', type: 'university' },
  { id: 'srm', name: 'SRM', fullName: 'SRM Institute of Science and Technology', country: 'India', type: 'university' },
  { id: 'manipal', name: 'Manipal', fullName: 'Manipal Academy of Higher Education', country: 'India', type: 'university' },
  { id: 'anna', name: 'Anna University', fullName: 'Anna University Chennai', country: 'India', type: 'university' },
  { id: 'mu', name: 'Mumbai University', fullName: 'University of Mumbai', country: 'India', type: 'university' },
  { id: 'osmania', name: 'Osmania', fullName: 'Osmania University Hyderabad', country: 'India', type: 'university' },
  { id: 'pune', name: 'Pune University', fullName: 'Savitribai Phule Pune University', country: 'India', type: 'university' },
  { id: 'jadavpur', name: 'Jadavpur', fullName: 'Jadavpur University Kolkata', country: 'India', type: 'university' },
  // India - Colleges
  { id: 'stephens', name: "St. Stephen's", fullName: "St. Stephen's College Delhi", country: 'India', type: 'college' },
  { id: 'hindu', name: 'Hindu College', fullName: 'Hindu College Delhi', country: 'India', type: 'college' },
  { id: 'loyola', name: 'Loyola', fullName: 'Loyola College Chennai', country: 'India', type: 'college' },
  { id: 'xaviers', name: "Xavier's", fullName: "St. Xavier's College Mumbai", country: 'India', type: 'college' },

  // United States - Universities
  { id: 'mit', name: 'MIT', fullName: 'Massachusetts Institute of Technology', country: 'United States', type: 'university' },
  { id: 'stanford', name: 'Stanford', fullName: 'Stanford University', country: 'United States', type: 'university' },
  { id: 'harvard', name: 'Harvard', fullName: 'Harvard University', country: 'United States', type: 'university' },
  { id: 'yale', name: 'Yale', fullName: 'Yale University', country: 'United States', type: 'university' },
  { id: 'princeton', name: 'Princeton', fullName: 'Princeton University', country: 'United States', type: 'university' },
  { id: 'columbia', name: 'Columbia', fullName: 'Columbia University', country: 'United States', type: 'university' },
  { id: 'uchicago', name: 'UChicago', fullName: 'University of Chicago', country: 'United States', type: 'university' },
  { id: 'caltech', name: 'Caltech', fullName: 'California Institute of Technology', country: 'United States', type: 'university' },
  { id: 'upenn', name: 'UPenn', fullName: 'University of Pennsylvania', country: 'United States', type: 'university' },
  { id: 'ucla', name: 'UCLA', fullName: 'University of California, Los Angeles', country: 'United States', type: 'university' },
  { id: 'ucb', name: 'UC Berkeley', fullName: 'University of California, Berkeley', country: 'United States', type: 'university' },
  { id: 'nyu', name: 'NYU', fullName: 'New York University', country: 'United States', type: 'university' },
  { id: 'umich', name: 'UMich', fullName: 'University of Michigan', country: 'United States', type: 'university' },
  { id: 'gatech', name: 'Georgia Tech', fullName: 'Georgia Institute of Technology', country: 'United States', type: 'university' },
  { id: 'utexas', name: 'UT Austin', fullName: 'University of Texas at Austin', country: 'United States', type: 'university' },
  { id: 'cmu', name: 'CMU', fullName: 'Carnegie Mellon University', country: 'United States', type: 'university' },
  { id: 'uiuc', name: 'UIUC', fullName: 'University of Illinois Urbana-Champaign', country: 'United States', type: 'university' },
  { id: 'cornell', name: 'Cornell', fullName: 'Cornell University', country: 'United States', type: 'university' },

  // United Kingdom - Universities
  { id: 'oxford', name: 'Oxford', fullName: 'University of Oxford', country: 'United Kingdom', type: 'university' },
  { id: 'cambridge', name: 'Cambridge', fullName: 'University of Cambridge', country: 'United Kingdom', type: 'university' },
  { id: 'imperial', name: 'Imperial', fullName: 'Imperial College London', country: 'United Kingdom', type: 'university' },
  { id: 'ucl', name: 'UCL', fullName: 'University College London', country: 'United Kingdom', type: 'university' },
  { id: 'lse', name: 'LSE', fullName: 'London School of Economics', country: 'United Kingdom', type: 'university' },
  { id: 'kcl', name: "King's", fullName: "King's College London", country: 'United Kingdom', type: 'university' },
  { id: 'edinburgh', name: 'Edinburgh', fullName: 'University of Edinburgh', country: 'United Kingdom', type: 'university' },
  { id: 'manchester', name: 'Manchester', fullName: 'University of Manchester', country: 'United Kingdom', type: 'university' },
  { id: 'warwick', name: 'Warwick', fullName: 'University of Warwick', country: 'United Kingdom', type: 'university' },
  { id: 'bristol', name: 'Bristol', fullName: 'University of Bristol', country: 'United Kingdom', type: 'university' },
  { id: 'glasgow', name: 'Glasgow', fullName: 'University of Glasgow', country: 'United Kingdom', type: 'university' },
  { id: 'birmingham', name: 'Birmingham', fullName: 'University of Birmingham', country: 'United Kingdom', type: 'university' },
  { id: 'leeds', name: 'Leeds', fullName: 'University of Leeds', country: 'United Kingdom', type: 'university' },
  { id: 'sheffield', name: 'Sheffield', fullName: 'University of Sheffield', country: 'United Kingdom', type: 'university' },
  { id: 'nottingham', name: 'Nottingham', fullName: 'University of Nottingham', country: 'United Kingdom', type: 'university' },
];

export type UniversityId = string;

export const IDENTITY_TAGS = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Secret Admirer',
  'Night Owl',
  'Library Ghost',
  'Cafeteria Regular',
  'Backbencher',
  'Topper',
  'Anonymous',
] as const;

export type IdentityTag = typeof IDENTITY_TAGS[number];

export type Gender = 'male' | 'female' | 'other';
