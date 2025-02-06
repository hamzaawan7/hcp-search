import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DirectSearch.css";

const DirectSearchPage = () => {
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [formData, setFormData] = useState({
    npi: "",
    firstName: "",
    lastName: "",
    address: "",
    state: "",
    city: "",
    mailingCity: "",
    mailingState: "",
    licenseState: "",
    licenseNumber: "",
    specialty: "",
    mailing_address: "",
    mailing_postal_code: "",
    practice_postal_code: "",
    taxonomy_code: "",
    country: "",
    provider_Credential_Text: "",
    provider_Name_Prefix_Text: "",
  });
  const [showMultipleSearch, setShowMultipleSearch] = useState(false);
  const [multipleSearchTerm, setMultipleSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [exactMatches, setExactMatches] = useState([]);
  const [country, setCountry] = useState("All"); // Default to "All" countries
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    pageSize: 10,
  });
  const [exactMatchesPagination, setExactMatchesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    pageSize: 10,
  });
  const [suggestedMatchesPagination, setSuggestedMatchesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    pageSize: 10,
  });
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupRowIndex, setPopupRowIndex] = useState(null);
  const [aiMatching, setAiMatching] = useState(false);

  const stateCities = {
    AL:  ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa", "Hoover", "Dothan", "Decatur", "Auburn", "Gadsden", "Florence", "Vestavia Hills", "Phenix City", "Prattville", "Alabaster", "Bessemer", "Enterprise", "Opelika", "Homewood", "Madison", "Anniston", "Selma", "Mountain Brook", "Pelham", "Trussville", "Helena", "Fairhope", "Oxford", "Cullman", "Foley"],
    AK: ["Anchorage", "Fairbanks", "Juneau", "Wasilla", "Sitka", "Ketchikan", "Kenai", "Kodiak", "Bethel", "Palmer"],
    AZ: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe", "Peoria", "Surprise"],
    AR: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro", "North Little Rock", "Conway", "Rogers", "Pine Bluff", "Bentonville"],
    CA: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim"],
    CO: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo", "Greeley"],
    CT: ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury", "Norwalk", "Danbury", "New Britain", "Bristol", "Meriden"],
    DE: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna", "Milford", "Seaford", "Georgetown", "Elsmere", "New Castle"],
    FL: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral"],
    GA: ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Sandy Springs", "Roswell", "Albany", "Johns Creek"],
    HI: ["Honolulu", "Hilo", "Kailua", "Kapolei", "Waipahu", "Ewa Beach", "Pearl City", "Kaneohe", "Mililani", "Wahiawa"],
    ID: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello", "Caldwell", "Twin Falls", "Lewiston", "Post Falls", "Rexburg"],
    IL: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Elgin", "Peoria", "Champaign", "Waukegan"],
    IN: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers", "Bloomington", "Hammond", "Lafayette", "Gary"],
    IA: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Waterloo", "Ames", "West Des Moines", "Dubuque", "Ankeny", "Urbandale"],
    KS: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka", "Lawrence", "Shawnee", "Manhattan", "Lenexa", "Salina"],
    KY: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Hopkinsville", "Richmond", "Florence", "Georgetown", "Elizabethtown"],
    LA: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles", "Bossier City", "Kenner", "Monroe", "Alexandria", "Houma"],
    ME: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Biddeford", "Sanford", "Saco", "Westbrook", "Augusta"],
    MD: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie", "Hagerstown", "Annapolis", "College Park", "Salisbury", "Laurel"],
    MA: ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge", "New Bedford", "Brockton", "Quincy", "Lynn", "Fall River"],
    MI: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing", "Flint", "Dearborn", "Livonia", "Westland"],
    MN: ["Minneapolis", "Saint Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park", "Plymouth", "Maple Grove", "Woodbury", "Eagan"],
    MS: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi", "Meridian", "Tupelo", "Olive Branch", "Greenville", "Horn Lake"],
    MO: ["Kansas City", "Saint Louis", "Springfield", "Independence", "Columbia", "Lee's Summit", "O'Fallon", "Saint Joseph", "Saint Charles", "Blue Springs"],
    MT: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena", "Kalispell", "Havre", "Anaconda", "Miles City"],
    NE: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney", "Fremont", "Hastings", "Norfolk", "North Platte", "Papillion"],
    NV: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City", "Elko", "Fernley", "Mesquite", "Boulder City"],
    NH: ["Manchester", "Nashua", "Concord", "Derry", "Rochester", "Salem", "Dover", "Merrimack", "Hudson", "Keene"],
    NJ: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Lakewood", "Edison", "Woodbridge", "Toms River", "Hamilton", "Clifton"],
    NM: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Farmington", "Clovis", "Hobbs", "Carlsbad", "Gallup"],
    NY: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica"],
    NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "High Point", "Wilmington", "Asheville"],
    ND: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo", "Williston", "Dickinson", "Mandan", "Jamestown", "Wahpeton"],
    OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain"],
    OK: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond", "Lawton", "Moore", "Midwest City", "Stillwater", "Enid"],
    OR: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro", "Beaverton", "Bend", "Medford", "Springfield", "Corvallis"],
    PA: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "York"],
    RI: ["Providence", "Cranston", "Warwick", "Pawtucket", "East Providence", "Woonsocket", "Coventry", "Cumberland", "North Providence", "South Kingstown"],
    SC: ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville", "Summerville", "Sumter", "Goose Creek", "Hilton Head Island"],
    SD: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown", "Mitchell", "Yankton", "Pierre", "Huron", "Vermillion"],
    TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro", "Franklin", "Jackson", "Johnson City", "Bartlett"],    TX: ["Houston", "Austin", "Dallas"],
    UT: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Sandy", "Ogden", "St. George", "Layton", "South Jordan"],
    VT: ["Burlington", "South Burlington", "Rutland", "Essex Junction", "Barre", "Bennington", "Williston", "Montpelier", "Middlebury", "Brattleboro"],
    VA: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Hampton", "Roanoke", "Portsmouth", "Suffolk"],
    WA: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Federal Way", "Yakima"],
    WV: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling", "Weirton", "Fairmont", "Beckley", "Martinsburg", "Clarksburg"],
    WI: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton", "Waukesha", "Eau Claire", "Oshkosh", "Janesville"],
    WY: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs", "Sheridan", "Green River", "Evanston", "Riverton", "Jackson"],
  };

  const specialities = [
    "Acupuncturist",
    "Acute Care",
    "Addiction (Substance Use Disorder)",
    "Addiction Medicine",
    "Addiction Psychiatry",
    "Administrator",
    "Adolescent and Children Mental Health",
    "Adolescent Medicine",
    "Adult Care Home",
    "Adult Companion",
    "Adult Congenital Heart Disease",
    "Adult Day Care",
    "Adult Development & Aging",
    "Adult Health",
    "Adult Medicine",
    "Adult Mental Health",
    "Adult Reconstructive Orthopaedic Surgery",
    "Advanced Heart Failure and Transplant Cardiology",
    "Advanced Practice Dental Therapist",
    "Advanced Practice Midwife",
    "Aerospace Medicine",
    "Agencies",
    "Air Carrier",
    "Air Transport",
    "Allergy",
    "Allergy & Immunology",
    "Allopathic & Osteopathic Physicians",
    "Alzheimer Center (Dementia Center)",
    "Ambulance",
    "Ambulatory Care",
    "Ambulatory Family Planning Facility",
    "Ambulatory Fertility Facility",
    "Ambulatory Health Care Facilities",
    "Ambulatory Surgical",
    "Amputee",
    "Anaplastologist",
    "Anatomic Pathology",
    "Anatomic Pathology & Clinical Pathology",
    "Anesthesiologist Assistant",
    "Anesthesiology",
    "Art Therapist",
    "Art, Medical",
    "Assistant Behavior Analyst",
    "Assistant Record Technician",
    "Assistant, Podiatric",
    "Assisted Living Facility",
    "Assisted Living, Behavioral Disturbances",
    "Assisted Living, Mental Illness",
    "Assistive Technology Practitioner",
    "Assistive Technology Supplier",
    "Athletic Trainer",
    "Attendant Care Provider",
    "Audiologist",
    "Audiologist-Hearing Aid Fitter",
    "Audiology Assistant",
    "Augmentative Communication",
    "Behavior Analyst",
    "Behavior Technician",
    "Behavioral Health & Social Service Providers",
    "Behavioral Neurology & Neuropsychiatry",
    "Biochemist",
    "Biomedical Engineering",
    "Biomedical Photographer",
    "Biostatistician",
    "Birthing",
    "Blood Bank",
    "Blood Banking",
    "Blood Banking & Transfusion Medicine",
    "Body Imaging",
    "Bone Densitometry",
    "Brain Injury Medicine",
    "Bus",
    "Cardiac Rehabilitation",
    "Cardiac-Interventional Technology",
    "Cardiopulmonary",
    "Cardiovascular Disease",
    "Cardiovascular Invasive Specialist",
    "Cardiovascular-Interventional Technology",
    "Case Management",
    "Case Manager/Care Coordinator",
    "Chemical Pathology",
    "Chemistry",
    "Child & Adolescent Psychiatry",
    "Child Abuse Pediatrics",
    "Children",
    "Chiropractic Providers",
    "Chiropractor",
    "Chore Provider",
    "Chronic Care",
    "Chronic Disease Hospital",
    "Clinic Pharmacy",
    "Clinical",
    "Clinic/Center",
    "Clinical & Laboratory Dermatological Immunology",
    "Clinical & Laboratory Immunology",
    "Clinical Biochemical Genetics",
    "Clinical Cardiac Electrophysiology",
    "Clinical Child & Adolescent",
    "Clinical Cytogenetics",
    "Clinical Ethicist",
    "Clinical Exercise Physiologist",
    "Clinical Genetics (M.D.)",
    "Clinical Informatics",
    "Clinical Laboratory Director, Non-physician",
    "Clinical Medical Laboratory",
    "Clinical Molecular Genetics",
    "Clinical Neurophysiology",
    "Clinical Neuropsychologist",
    "Clinical Nurse Specialist",
    "Clinical Pathology",
    "Clinical Pathology/Laboratory Medicine",
    "Clinical Pharmacology",
    "Coding Specialist, Hospital Based",
    "Coding Specialist, Physician Office Based",
    "Cognitive & Behavioral",
    "College Health",
    "Colon & Rectal Surgery",
    "Community Based Residential Treatment Facility, Intellectual and/or Developmental Disabilities",
    "Community Based Residential Treatment Facility, Mental Illness",
    "Community Health",
    "Community Health Worker",
    "Community Health/Public Health",
    "Community/Behavioral Health",
    "Community/Retail Pharmacy",
    "Compounding Pharmacy",
    "Computed Tomography",
    "Contact Lens",
    "Contact Lens Fitter",
    "Continence Care",
    "Continuing Education/Staff Development",
    "Contractor",
    "Cornea and External Diseases Specialist",
    "Corneal and Contact Management",
    "Corporate Health",
    "Counseling",
    "Counselor",
    "Critical Access",
    "Critical Access Hospital",
    "Critical Care",
    "Custodial Care Facility",
    "Critical Care Medicine",
    "Customized Equipment",
    "Cytopathology",
    "Cytotechnology",
    "Dance Therapist",
    "Darkroom",
    "Day Training, Developmentally Disabled Services",
    "Day Training/Habilitation Specialist",
    "Dental",
    "Dental Assistant",
    "Dental Hygienist",
    "Dental Laboratory",
    "Dental Laboratory Technician",
    "Dental Providers",
    "Dental Public Health",
    "Dental Therapist",
    "Dentist",
    "Dentist Anesthesiologist",
    "Denturist",
    "Department of Veterans Affairs (VA) Pharmacy",
    "Dermatology",
    "Dermatopathology",
    "Developmental - Behavioral Pediatrics",
    "Developmental Disabilities",
    "Developmental Therapist",
    "Diabetes Educator",
    "Diagnostic Neuroimaging",
    "Diagnostic Radiology",
    "Diagnostic Ultrasound",
    "Dialysis Equipment & Supplies",
    "Dialysis, Peritoneal",
    "Dietary & Nutritional Service Providers",
    "Dietary Manager",
    "Dietetic Technician, Registered",
    "Dietitian, Registered",
    "Doula",
    "Drama Therapist",
    "Driver",
    "Driving and Community Mobility",
    "Durable Medical Equipment & Medical Supplies",
    "Early Intervention Provider Agency",
    "Educational",
    "EEG",
    "Electrodiagnostic Medicine",
    "Electroneurodiagnostic",
    "Electrophysiology, Clinical",
    "Emergency",
    "Emergency Care",
    "Emergency Medical Service Providers",
    "Emergency Medical Services",
    "Emergency Medical Technician, Basic",
    "Emergency Medical Technician, Intermediate",
    "Emergency Medical Technician, Paramedic",
    "Emergency Medicine",
    "Emergency Response System Companies",
    "Endocrinology, Diabetes & Metabolism",
    "Endodontics",
    "Endoscopy",
    "End-Stage Renal Disease (ESRD) Treatment",
    "Enterostomal Therapy",
    "Environmental Modification",
    "Epilepsy",
    "Epilepsy Unit",
    "Ergonomics",
    "Exclusive Provider Organization",
    "Exercise & Sports",
    "Eye and Vision Services Providers",
    "Eye Bank",
    "Eyewear Supplier",
    "Facial Plastic Surgery",
    "Family",
    "Family Health",
    "Family Medicine",
    "Family Planning, Non-Surgical",
    "Federally Qualified Health Center (FQHC)",
    "Feeding, Eating & Swallowing",
    "Female Pelvic Medicine and Reconstructive Surgery",
    "Flight",
    "Foot & Ankle Surgery",
    "Foot and Ankle Surgery",
    "Foot Surgery",
    "Forensic",
    "Forensic Pathology",
    "Forensic Psychiatry",
    "Foster Care Agency",
    "Funeral Director",
    "Gastroenterology",
    "General Acute Care Hospital",
    "General Care",
    "General Practice",
    "Genetic Counselor, MS",
    "Geneticist, Medical (PhD)",
    "Genetics",
    "Geriatric",
    "Geriatric Care",
    "Geriatric Medicine",
    "Geriatric Psychiatry",
    "Geriatrics",
    "Gerontology",
    "Glaucoma Specialist",
    "Graphics Designer",
    "Graphics Methods",
    "Group",
    "Group Psychotherapy",
    "Gynecologic Oncology",
    "Gynecology",
    "Hand",
    "Hand Surgery",
    "Health",
    "Health & Wellness Coach",
    "Health Educator",
    "Health Maintenance Organization",
    "Health Service",
    "Hearing Aid Equipment",
    "Hearing and Speech",
    "Hearing Instrument Specialist",
    "Hemapheresis Practitioner",
    "Hematology",
    "Hematology & Oncology",
    "Hemodialysis",
    "Hepatology",
    "Histology",
    "Holistic",
    "Home Delivered Meals",
    "Home Health",
    "Home Health Aide",
    "Home Infusion",
    "Home Infusion Therapy Pharmacy",
    "Home Modifications",
    "Homemaker",
    "Homeopath",
    "Hospice",
    "Hospice and Palliative Medicine",
    "Hospice Care, Community Based",
    "Hospice, Inpatient",
    "Hospital Units",
    "Hospitalist",
    "Hospitals",
    "Human Factors",
    "Hypertension Specialist",
    "Illustration, Medical",
    "Immunology",
    "Immunopathology",
    "In Home Supportive Care",
    "In Vivo & In Vitro Nuclear Medicine",
    "Independent Duty Corpsman",
    "Independent Duty Medical Technicians",
    "Independent Medical Examiner",
    "Indian Health Service/Tribal/Urban Indian Health (I/T/U) Pharmacy",
    "Infection Control",
    "Infectious Disease",
    "Informatics",
    "Infusion Therapy",
    "Institutional Pharmacy",
    "Intellectual & Developmental Disabilities",
    "Intermediate Care Facility, Mental Illness",
    "Intermediate Care Facility, Mentally Retarded",
    "Internal Medicine",
    "Internist",
    "Interpreter",
    "Interventional Cardiology",
    "Interventional Pain Medicine",
    "Kinesiotherapist",
    "Laboratories",
    "Laboratory Management",
    "Laboratory Management, Diplomate",
    "Lactation Consultant",
    "Lactation Consultant, Non-RN",
    "Land Transport",
    "Legal Medicine",
    "Licensed Practical Nurse",
    "Licensed Psychiatric Technician",
    "Licensed Vocational Nurse",
    "Lithotripsy",
    "Local Education Agency (LEA)",
    "Lodging",
    "Long Term Care Hospital",
    "Long Term Care Pharmacy",
    "Long-Term Care",
    "Low Vision",
    "Low Vision Rehabilitation",
    "Magnetic Resonance Imaging",
    "Magnetic Resonance Imaging (MRI)",
    "Mail Order Pharmacy",
    "Mammography",
    "Managed Care Organization Pharmacy",
    "Managed Care Organizations",
    "Marriage & Family Therapist",
    "Massage Therapist",
    "Mastectomy Fitter",
    "Maternal & Fetal Medicine",
    "Maternal Newborn",
    "Meals",
    "Mechanotherapist",
    "Medical",
    "Medical Foods Supplier",
    "Medical Genetics",
    "Medical Genetics, Ph.D. Medical Genetics",
    "Medical Laboratory",
    "Medical Microbiology",
    "Medical Oncology",
    "Medical Research",
    "Medical Specialty",
    "Medical Technologist",
    "Medical Toxicology",
    "Medically Fragile Infants and Children Day Care",
    "Medical-Surgical",
    "Medicare Defined Swing Bed Unit",
    "Mental Health",
    "Mental Health (Including Community Mental Health Center)",
    "Methadone",
    "Microbiology",
    "Midwife",
    "Midwife, Lay",
    "Migrant Health",
    "Military Ambulatory Procedure Visits Operational (Transportable)",
    "Military and U.S. Coast Guard Ambulatory Procedure",
    "Military Clinical Medical Laboratory",
    "Military General Acute Care Hospital",
    "Military General Acute Care Hospital. Operational (Transportable)",
    "Military Health Care Provider",
    "Military Hospital",
    "Military or U.S. Coast Guard Ambulance, Air Transport",
    "Military or U.S. Coast Guard Ambulance, Ground Transport",
    "Military or U.S. Coast Guard Ambulance, Water Transport",
    "Military Outpatient Operational (Transportable) Component",
    "Military/U.S. Coast Guard Outpatient",
    "Military/U.S. Coast Guard Pharmacy",
    "Military/U.S. Coast Guard Transport",
    "MOHS-Micrographic Surgery",
    "Molecular Genetic Pathology",
    "Multi-Specialty",
    "Music Therapist",
    "Naprapath",
    "Naturopath",
    "Neonatal",
    "Neonatal Intensive Care",
    "Neonatal, Critical Care",
    "Neonatal, Low-Risk",
    "Neonatal/Pediatrics",
    "Neonatal-Perinatal Medicine",
    "Nephrology",
    "Neurocritical Care",
    "Neurodevelopmental Disabilities",
    "Neurological Surgery",
    "Neurology",
    "Neurology with Special Qualifications in Child Neurology",
    "Neuromuscular Medicine",
    "Neuromusculoskeletal Medicine & OMM",
    "Neuromusculoskeletal Medicine, Sports Medicine",
    "Neuro-ophthalmology",
    "Neuropathology",
    "Neuroradiology",
    "Neurorehabilitation",
    "Neuroscience",
    "Non-emergency Medical Transport (VAN)",
    "Non-Pharmacy Dispensing Site",
    "Nuclear",
    "Nuclear Cardiology",
    "Nuclear Imaging & Therapy",
    "Nuclear Medicine",
    "Nuclear Medicine Technology",
    "Nuclear Pharmacy",
    "Nuclear Radiology",
    "Nurse Anesthetist, Certified Registered",
    "Nurse Massage Therapist (NMT)",
    "Nurse Practitioner",
    "Nurse's Aide",
    "Nursing & Custodial Care Facilities",
    "Nursing Care",
    "Nursing Care, Pediatric",
    "Nursing Facility Supplies",
    "Nursing Facility/Intermediate Care Facility",
    "Nursing Home Administrator",
    "Nursing Service Providers",
    "Nursing Service Related Providers",
    "Nutrition",
    "Nutrition Support",
    "Nutrition, Education",
    "Nutrition, Gerontological",
    "Nutrition, Metabolic",
    "Nutrition, Obesity and Weight Management",
    "Nutrition, Oncology",
    "Nutrition, Pediatric",
    "Nutrition, Pediatric Critical Care",
    "Nutrition, Renal",
    "Nutrition, Sports Dietetics",
    "Nutritionist",
    "Obesity Medicine",
    "Obstetric, High-Risk",
    "Obstetric, Inpatient",
    "Obstetrics",
    "Obstetrics & Gynecology",
    "Occupational Health",
    "Occupational Medicine",
    "Occupational Therapist",
    "Occupational Therapy Assistant",
    "Occupational Vision",
    "Ocularist",
    "Oncology",
    "Oncology, Pediatrics",
    "Oncology, Radiation",
    "Ophthalmic",
    "Ophthalmic Assistant",
    "Ophthalmic Plastic and Reconstructive Surgery",
    "Ophthalmologic Surgery",
    "Ophthalmology",
    "Optician",
    "Optometric Assistant",
    "Optometric Technician",
    "Optometrist",
    "Oral & Maxillofacial Surgery",
    "Oral and Maxillofacial Pathology",
    "Oral and Maxillofacial Radiology",
    "Oral and Maxillofacial Surgery",
    "Oral Medicinist",
    "Organ Procurement Organization",
    "Orientation and Mobility Training Provider",
    "Orofacial Pain",
    "Orthodontics and Dentofacial Orthopedics",
    "Orthopaedic Surgery",
    "Orthopaedic Surgery of the Spine",
    "Orthopaedic Trauma",
    "Orthopedic",
    "Orthopedic Assistant",
    "Orthoptist",
    "Orthotic Fitter",
    "Orthotist",
    "Ostomy Care",
    "Other Service Providers",
    "Otolaryngic Allergy",
    "Otolaryngology",
    "Otolaryngology/Facial Plastic Surgery",
    "Otology & Neurotology",
    "Otorhinolaryngology & Head-Neck",
    "Oxygen Equipment & Supplies",
    "Pain",
    "Pain Management",
    "Pain Medicine",
    "Palliative/Hospice",
    "Parenteral & Enteral Nutrition",
    "Pastoral",
    "Pathology",
    "Patient Transport",
    "Pediatric Allergy/Immunology",
    "Pediatric Anesthesiology",
    "Pediatric Cardiology",
    "Pediatric Chiropractor",
    "Pediatric Critical Care Medicine",
    "Pediatric Dentistry",
    "Pediatric Dermatology",
    "Pediatric Emergency Medicine",
    "Pediatric Endocrinology",
    "Pediatric Gastroenterology",
    "Pediatric Hematology-Oncology",
    "Pediatric Infectious Diseases",
    "Pediatric Nephrology",
    "Pediatric Oncology",
    "Pediatric Ophthalmology and Strabismus Specialist",
    "Pediatric Orthopaedic Surgery",
    "Pediatric Otolaryngology",
    "Pediatric Pathology",
    "Pediatric Pulmonology",
    "Pediatric Radiology",
    "Pediatric Rehabilitation Medicine",
    "Pediatric Rheumatology",
    "Pediatric Surgery",
    "Pediatric Transplant Hepatology",
    "Pediatric Urology",
    "Pediatrics",
    "Pediatrics, Critical Care",
    "Pedorthist",
    "Peer Specialist",
    "Perfusionist",
    "Perinatal",
    "Periodontics",
    "Perioperative",
    "Personal Care Attendant",
    "Personal Emergency Response Attendant",
    "Ph.D. Medical Genetics",
    "Pharmacist",
    "Pharmacist Clinician (PhC)/ Clinical Pharmacy Specialist",
    "Pharmacotherapy",
    "Pharmacy",
    "Pharmacy Service Providers",
    "Pharmacy Technician",
    "Phlebology",
    "Phlebotomy",
    "Physical Medicine & Rehabilitation",
    "Physical Rehabilitation",
    "Physical Therapist",
    "Physical Therapy",
    "Physical Therapy Assistant",
    "Physician Assistant",
    "Physician Assistants & Advanced Practice Nursing Providers",
    "Physiological Laboratory",
    "Plastic and Reconstructive Surgery",
    "Plastic Surgery",
    "Plastic Surgery within the Head & Neck",
    "Plastic Surgery Within the Head and Neck",
    "Podiatric",
    "Podiatric Medicine & Surgery Service Providers",
    "Podiatrist",
    "Poetry Therapist",
    "Point of Service",
    "Portable X-ray and/or Other Portable Diagnostic Imaging Supplier",
    "Preferred Provider Organization",
    "Prescribing (Medical)",
    "Prevention Professional",
    "Preventive Medicine",
    "Preventive Medicine/Occupational Environmental Medicine",
    "Primary Care",
    "Primary Podiatric Medicine",
    "Prison Health",
    "Private Vehicle",
    "Procedural Dermatology",
    "Professional",
    "Program of All-Inclusive Care for the Elderly (PACE) Provider Organization",
    "Prosthetic/Orthotic Supplier",
    "Prosthetics Case Management",
    "Prosthetist",
    "Prosthodontics",
    "Psychiatric",
    "Psychiatric Hospital",
    "Psychiatric Residential Treatment Facility",
    "Psychiatric Unit",
    "Psychiatric/Mental Health",
    "Psychiatric/Mental Health, Adult",
    "Psychiatric/Mental Health, Child & Adolescent",
    "Psychiatric/Mental Health, Child & Family",
    "Psychiatric/Mental Health, Chronically Ill",
    "Psychiatric/Mental Health, Community",
    "Psychiatric/Mental Health, Geropsychiatric",
    "Psychiatry",
    "Psychiatry & Neurology",
    "Psychoanalysis",
    "Psychoanalyst",
    "Psychologist",
    "Psychosomatic Medicine",
    "Public Health & General Preventive Medicine",
    "Public Health or Welfare",
    "Public Health, Federal",
    "Public Health, State or Local",
    "Public Medicine",
    "Pulmonary Diagnostics",
    "Pulmonary Disease",
    "Pulmonary Function Technologist",
    "Pulmonary Rehabilitation",
    "Quality Management",
    "Radiation Oncology",
    "Radiation Therapy",
    "Radiography",
    "Radiologic Technologist",
    "Radiological Physics",
    "Radiology",
    "Radiology Practitioner Assistant",
    "Radiology, Mammography",
    "Radiology, Mobile",
    "Radiology, Mobile Mammography",
    "Recovery Care",
    "Recreation Therapist",
    "Recreational Therapist Assistant",
    "Reflexologist",
    "Registered Nurse",
    "Registered Nurse First Assistant",
    "Registered Record Administrator",
    "Rehabilitation",
    "Rehabilitation Counselor",
    "Rehabilitation Hospital",
    "Rehabilitation Practitioner",
    "Rehabilitation Unit",
    "Rehabilitation, Blind",
    "Rehabilitation, Cardiac Facilities",
    "Rehabilitation, Comprehensive Outpatient Rehabilitation Facility (CORF)",
    "Rehabilitation, Substance Use Disorder",
    "Rehabilitation, Substance Use Disorder Unit",
    "Religious Nonmedical Health Care Institution",
    "Religious Nonmedical Nursing Personnel",
    "Religious Nonmedical Practitioner",
    "Renal Dialysis",
    "Reproductive Endocrinology",
    "Reproductive Endocrinology/Infertility",
    "Research",
    "Research Data Abstracter/Coder",
    "Research Study",
    "Residential Treatment Facilities",
    "Residential Treatment Facility, Emotionally Disturbed Children",
    "Residential Treatment Facility, Intellectual and/or Developmental Disabilities",
    "Residential Treatment Facility, Physical Disabilities",
    "Respiratory Therapist, Certified",
    "Respiratory Therapist, Registered",
    "Respiratory, Developmental, Rehabilitative and Restorative Service Providers",
    "Respite Care",
    "Respite Care Camp",
    "Respite Care Facility",
    "Respite Care, Intellectual and/or Developmental Disabilities, Child",
    "Respite Care, Mental Illness, Child",
    "Respite Care, Physical Disabilities, Child",
    "Retina Specialist",
    "Rheumatology",
    "Rural",
    "Rural Health",
    "School",
    "Secured Medical Transport (VAN)",
    "Single Specialty",
    "Skilled Nursing Facility",
    "Sleep Disorder Diagnostic",
    "Sleep Medicine",
    "Sleep Specialist, PhD",
    "SNF/Subacute Care",
    "Social Worker",
    "Sonography",
    "Special Hospital",
    "Specialist",
    "Specialist/Technologist",
    "Specialist/Technologist Cardiovascular",
    "Specialist/Technologist, Health Information",
    "Specialist/Technologist, Other",
    "Specialist/Technologist, Pathology",
    "Specialty Pharmacy",
    "Speech, Language and Hearing Service Providers",
    "Speech-Language Assistant",
    "Speech-Language Pathologist",
    "Spinal Cord Injury Medicine",
    "Sports",
    "Sports Medicine",
    "Sports Physician",
    "Sports Vision",
    "Student Health",
    "Student in an Organized Health Care Education/Training Program",
    "Student, Health Care",
    "Substance Abuse Rehabilitation Facility",
    "Substance Abuse Treatment, Children",
    "Suppliers",
    "Supports Brokerage",
    "Surgery",
    "Surgery of the Hand",
    "Surgical",
    "Surgical Assistant",
    "Surgical Critical Care",
    "Surgical Oncology",
    "Surgical Technologist",
    "Taxi",
    "Technician",
    "Technician, Cardiology",
    "Technician, Health Information",
    "Technician, Other",
    "Technician, Pathology",
    "Technician/Technologist",
    "Technologists, Technicians & Other Technical Service Providers",
    "Therapeutic Radiology",
    "Thermography",
    "Thoracic Surgery (Cardiothoracic Vascular Surgery)",
    "Train",
    "Transplant Hepatology",
    "Transplant Surgery",
    "Transplantation",
    "Transportation Broker",
    "Transportation Network Company",
    "Transportation Services",
    "Trauma Surgery",
    "Undersea and Hyperbaric Medicine",
    "Urgent Care",
    "Urology",
    "Uveitis and Ocular Inflammatory Disease",
    "VA",
    "Vascular & Interventional Radiology",
    "Vascular Neurology",
    "Vascular Sonography",
    "Vascular Specialist",
    "Vascular Surgery",
    "Vascular-Interventional Technology",
    "Vehicle Modifications",
    "Veterinarian",
    "Veterinary",
    "Vision Therapy",
    "Voluntary or Charitable",
    "Water Transport",
    "Women",
    "Women's Health",
    "Women's Health Care, Ambulatory",
    "Wound Care"
  ];


  const toggleSearchMode = () => {
    setShowMultipleSearch(!showMultipleSearch);
    clearForm();
  };

  const handleMultipleSearch = async (page = 1) => {
    if (!multipleSearchTerm.trim()) {
      alert("Please enter at least one NPI for multiple search.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get("http://3.144.232.139:5000/search/multiple", {
        params: {
          term: multipleSearchTerm,
          page,
          limit: pagination.pageSize,
        },
      });
      setResults(data.results || []);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 10 });
      setExactMatches([]);
      setSearchPerformed(true);
    } catch (err) {
      console.error("Error fetching multiple search results:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAiMatching = () => {
    setAiMatching(!aiMatching);
    setExactMatches([]);
    setResults([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMailingStateChange = (e) => {
    const state = e.target.value;
    setFormData({ ...formData, state });
    setCities(stateCities[state] || []);
  };

  const handleLicenseStateChange = (e) => {
    const licenseState = e.target.value;
    setFormData({ ...formData, licenseState });
  };

  const handleSearch = async (page = 1, isExactMatch = false) => {
    const filteredParams = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value.trim() !== "")
    );

    if (country && country !== "All") {
      filteredParams.country = country;
    }

    setLoading(true);
    try {
      const endpoint = aiMatching
          ? "http://3.144.232.139:5000/search/smart/suggested"
          : "http://3.144.232.139:5000/search/direct";
      const queryParams = {
        ...filteredParams,
        page: isExactMatch ? exactMatchesPagination.currentPage : page,
        limit: isExactMatch ? exactMatchesPagination.pageSize : pagination.pageSize,
      };
      const { data } = await axios.get(endpoint, { params: queryParams });

      if (aiMatching) {
        setExactMatches(data.exactMatches || []);
        setResults(data.suggestedMatches || []);
        setExactMatchesPagination(data.exactPagination || { currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 10 });
        setSuggestedMatchesPagination(data.suggestedPagination || { currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 10 });
      } else {
        setResults(data.results || []);
        setExactMatches([]);
        setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalRecords: 0, pageSize: 10 });
      }
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (selectedCountry) => {
    setCountry(selectedCountry);
    handleSearch(1).catch((error) => console.error("Search failed:", error));
  };

  const handleView = async (record, index) => {
    try {
      if (popupRowIndex === index) {
        setPopupRowIndex(null);
        setSelectedRecord(null);
        return;
      }
      const { data } = await axios.get(
          `http://3.144.232.139:5000/search/direct/view/${record.NPI}`
      );
      setSelectedRecord(data.record);
      setPopupRowIndex(index);
    } catch (err) {
      console.error("Error fetching details:", err);
    }
  };

  const clearForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      address: "",
      country: "",
      npi: "",
      specialty: "",
      state: "",
      city: "",
      licenseState: "",
      licenseNumber: "",
    });
    setMultipleSearchTerm("");
    setResults([]);
    setExactMatches([]);
    setSearchPerformed(false);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      pageSize: 10,
    });
    setExactMatchesPagination({
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      pageSize: 10,
    });
    setSuggestedMatchesPagination({
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      pageSize: 10,
    });
  };

  return (
      <div className="direct-search-container">
        <header className="header">
          <h1>HCP Search</h1>
          <button className="toggle-search-mode" onClick={toggleSearchMode}>
            {showMultipleSearch ? "Direct Search" : "Multiple Search"}
          </button>
        </header>
        <div className="language-selection">
          <button
              className={`language-button ${country === "All" ? "active" : ""}`}
              onClick={() => handleCountryChange("All")}
          >
            <img src="/images/planet-earth.png" alt="Global"/> All
          </button>
          <button
              className={`language-button ${country === "US" ? "active" : ""}`}
              onClick={() => handleCountryChange("US")}
          >
            <img src="/images/US.png" alt="US Flag"/> United States
          </button>
          <button
              className={`language-button ${country === "Italy" || country === "ITA" ? "active" : ""}`}
              onClick={() => handleCountryChange("Italy")}
          >
            <img src="/images/italy.png" alt="Italy Flag"/> Italy
          </button>
          <button
              className={`language-button ${country === "Portugal" || country === "PRT" ? "active" : ""}`}
              onClick={() => handleCountryChange("Portugal")}
          >
            <img src="/images/portugal.png" alt="Portugal Flag"/> Portugal
          </button>
          <button
              className={`language-button ${country === "France" || country === "FRA" ? "active" : ""}`}
              onClick={() => handleCountryChange("France")}
          >
            <img src="/images/france.png" alt="France Flag"/> France
          </button>
          <button
              className={`language-button ${country === "Belgium" || country === "BEL" ? "active" : ""}`}
              onClick={() => handleCountryChange("Belgium")}
          >
            <img src="/images/belgium.png" alt="Belgium Flag"/> Belgium
          </button>
          <button
              className={`language-button ${country === "Netherland" || country === "NED" ? "active" : ""}`}
              onClick={() => handleCountryChange("Netherland")}
          >
            <img src="/images/netherlands.png" alt="Netherland Flag"/> Netherland
          </button>
        </div>
        {!showMultipleSearch && (
            <div className="toggle-container">
              <span className="toggle-label">ADVANCE AI MATCHING</span>
              <div
                  className={`toggle-button ${aiMatching ? "active" : ""}`}
                  onClick={toggleAiMatching}
              >
                <div className="toggle-circle"></div>
              </div>
            </div>
        )}
        {loading && <div className="revolving-loader"></div>}
        {showMultipleSearch ? (
            <div className="multiple-search-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Enter NPIs (comma-separated)</label>
                  <input
                      value={multipleSearchTerm}
                      onChange={(e) => setMultipleSearchTerm(e.target.value)}
                      placeholder="e.g. 1234567890, 0987654321"
                  />
                </div>
              </div>
              <div className="actions">
                <button onClick={() => handleMultipleSearch(1)}>
                  <img src="/images/search.png" alt="Search"/> Search
                </button>
                <button onClick={clearForm}>
                  <img src="/images/clear-format.png" alt="Clear"/> Clear
                </button>
              </div>
            </div>
        ) : (
            <div className="search-form">
              <div className="form-row">
                <div className="form-field">
                  <label>First Name</label>
                  <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter First Name"
                  />
                </div>
                <div className="form-field">
                  <label>Last Name</label>
                  <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter Last Name"
                  />
                </div>
                <div className="form-field">
                  <label>NPI</label>
                  <input
                      name="npi"
                      value={formData.npi}
                      onChange={handleInputChange}
                      placeholder="Enter NPI"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Specialty</label>
                  <select
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                  >
                    <option value="">Select Specialty</option>
                    {specialities.map((speciality, index) => (
                        <option key={index} value={speciality}>
                          {speciality}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Mailing State</label>
                  <select
                      name="state"
                      value={formData.state}
                      onChange={handleMailingStateChange}
                  >
                    <option value="">Select Mailing State</option>
                    {Object.keys(stateCities).map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Mailing City</label>
                  <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                  >
                    <option value="">Select Mailing City</option>
                    {cities.map((city, index) => (
                        <option key={index} value={city}>
                          {city}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Mailing Address</label>
                  <input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter Mailing Address"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>License State</label>
                  <select
                      name="licenseState"
                      value={formData.licenseState}
                      onChange={handleLicenseStateChange}
                  >
                    <option value="">Select License State</option>
                    {Object.keys(stateCities).map((licenseState) => (
                        <option key={licenseState} value={licenseState}>
                          {licenseState}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>License No</label>
                  <input
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="Enter License No"
                  />
                </div>
              </div>
              <div className="actions">
                <button onClick={() => handleSearch(1)}>
                  <img src="/images/search.png" alt="Search"/> Search
                </button>
                <button onClick={clearForm}>
                  <img src="/images/clear-format.png" alt="Clear"/> Clear
                </button>
              </div>
            </div>
        )}
        {exactMatches.length > 0 && (
            <div className="suggestedmatches">
              <h3>Exact Matches</h3>
              <table className="results-table">
                <thead>
                <tr>
                  <th>HCP ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Address</th>
                  <th>Country</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Specialty</th>
                  <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {exactMatches.map((item, index) => (
                    <React.Fragment key={item.NPI}>
                      <tr>
                        <td>{item.NPI}</td>
                        <td>{item.HCP_first_name}</td>
                        <td>{item.HCP_last_name}</td>
                        <td>{item.practice_address}</td>
                        <td>{item.Country}</td>
                        <td>{item.practice_city}</td>
                        <td>{item.practice_st}</td>
                        <td>{item.Specialty_1}</td>
                        <td>
                          <button onClick={() => handleView(item, index)}>View</button>
                        </td>
                      </tr>
                      {popupRowIndex === index && selectedRecord && (
                          <tr className="details-popup">
                            <td colSpan="14">
                              <div className="popup-content">
                                <h3>HCP ID: {selectedRecord.NPI}</h3>
                                <p>
                                  <strong>Practice Address:</strong>{" "}
                                  {selectedRecord.practice_address || "N/A"}
                                </p>
                                <p>
                                  <strong>Mailing Address:</strong>{" "}
                                  {selectedRecord.mailing_address || "N/A"}
                                </p>
                                <p>
                                  <strong>Mailing City:</strong>{" "}
                                  {selectedRecord.mailing_city || "N/A"}
                                </p>
                                <p>
                                  <strong>Mailing State:</strong>{" "}
                                  {selectedRecord.mailing_st || "N/A"}
                                </p>
                                <p>
                                  <strong>Mailing Postal Code:</strong>{" "}
                                  {selectedRecord.mailing_postal_code || "N/A"}
                                </p>
                                <p>
                                  <strong>Specialty 1:</strong>{" "}
                                  {selectedRecord.Specialty_2 || "N/A"}
                                </p>
                                <p>
                                  <strong>Specialty 2:</strong>{" "}
                                  {selectedRecord.Specialty_2 || "N/A"}
                                </p>
                                <p>
                                  <strong>Specialty 3:</strong>{" "}
                                  {selectedRecord.Specialty_3 || "N/A"}
                                </p>
                                <p>
                                  <strong>License Number:</strong>{" "}
                                  {selectedRecord.License_Number || "N/A"}
                                </p>
                                <p>
                                  <strong>Provider_Credential_Text:</strong>{" "}
                                  {selectedRecord.Provider_Credential_Text || "N/A"}
                                </p>
                                <p>
                                  <strong>Provider_Name_Prefix_Text:</strong>{" "}
                                  {selectedRecord.Provider_Name_Prefix_Text || "N/A"}
                                </p>
                                <p>
                                  <strong>practice_postal_code:</strong>{" "}
                                  {selectedRecord.practice_postal_code || "N/A"}
                                </p>
                                <p>
                                  <strong>Taxonomy_Code:</strong>{" "}
                                  {selectedRecord.Taxonomy_Code || "N/A"}
                                </p>
                                <p>
                                  <strong>Provider_License_State:</strong>{" "}
                                  {selectedRecord.Provider_License_State || "N/A"}
                                </p>
                              </div>
                            </td>
                          </tr>
                      )}
                    </React.Fragment>
                ))}
                </tbody>
              </table>
              <div className="pagination-controls">
                <button
                    disabled={exactMatchesPagination.currentPage === 1}
                    onClick={() => handleSearch(exactMatchesPagination.currentPage - 1, true)}
                >
                  Previous
                </button>
                <span>
        Page {exactMatchesPagination.currentPage} of {exactMatchesPagination.totalPages}
      </span>
                <button
                    disabled={exactMatchesPagination.currentPage === exactMatchesPagination.totalPages}
                    onClick={() => handleSearch(exactMatchesPagination.currentPage + 1, true)}
                >
                  Next
                </button>
              </div>
            </div>
        )}
        {results.length > 0 && (
            <div className="suggestedmatches">
              { aiMatching && <h3>Suggested Matches</h3>}
              <table className="results-table">
                <thead>
                <tr>
                  <th>HCP ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Address</th>
                  <th>Country</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Specialty</th>
                  {aiMatching && <th>Similarity</th>}
                  <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {results.map((item, index) => (
                    <React.Fragment key={item.NPI}>
                      <tr>
                        <td>{item.NPI}</td>
                        <td>{item.HCP_first_name}</td>
                        <td>{item.HCP_last_name}</td>
                        <td>{item.practice_address}</td>
                        <td>{item.Country}</td>
                        <td>{item.practice_city}</td>
                        <td>{item.practice_st}</td>
                        <td>{item.Specialty_1}</td>
                        {aiMatching && <td>{item.similarity || "N/A"}</td>}
                        <td>
                          <button onClick={() => handleView(item, index)}>View</button>
                        </td>
                      </tr>
                      {popupRowIndex === index && selectedRecord && (
                          <tr className="details-popup">
                            <td colSpan="14">
                              <div className="popup-content">
                                <h3>HCP ID: {selectedRecord.NPI}</h3>
                                <p>
                                  <strong>Practice Address:</strong>{" "}
                                  {selectedRecord.practice_address || "N/A"}
                                </p>
                                <p>
                                  <strong>Mailing Address:</strong>{" "}
                                  {selectedRecord.mailing_address || "N/A"}
                                </p>
                                <p>
                                  <strong>Mailing City:</strong>{" "}
                                  {selectedRecord.mailing_city || "N/A"}
                                </p>
                                <p>
                                  <strong>Mailing State:</strong>{" "}
                                  {selectedRecord.mailing_st || "N/A"}
                                </p>
                                <p>
                                  <strong>Mailing Postal Code:</strong>{" "}
                                  {selectedRecord.mailing_postal_code || "N/A"}
                                </p>
                                <p>
                                  <strong>Specialty 1:</strong>{" "}
                                  {selectedRecord.Specialty_2 || "N/A"}
                                </p>
                                <p>
                                  <strong>Specialty 2:</strong>{" "}
                                  {selectedRecord.Specialty_2 || "N/A"}
                                </p>
                                <p>
                                  <strong>Specialty 3:</strong>{" "}
                                  {selectedRecord.Specialty_3 || "N/A"}
                                </p>
                                <p>
                                  <strong>License Number:</strong>{" "}
                                  {selectedRecord.License_Number || "N/A"}
                                </p>
                                <p>
                                  <strong>Provider_Credential_Text:</strong>{" "}
                                  {selectedRecord.Provider_Credential_Text || "N/A"}
                                </p>
                                <p>
                                  <strong>Provider_Name_Prefix_Text:</strong>{" "}
                                  {selectedRecord.Provider_Name_Prefix_Text || "N/A"}
                                </p>
                                <p>
                                  <strong>practice_postal_code:</strong>{" "}
                                  {selectedRecord.practice_postal_code || "N/A"}
                                </p>
                                <p>
                                  <strong>Taxonomy_Code:</strong>{" "}
                                  {selectedRecord.Taxonomy_Code || "N/A"}
                                </p>
                                <p>
                                  <strong>Provider_License_State:</strong>{" "}
                                  {selectedRecord.Provider_License_State || "N/A"}
                                </p>
                              </div>
                            </td>
                          </tr>
                      )}
                    </React.Fragment>
                ))}
                </tbody>
              </table>
            </div>
        )}
        {results.length > 0 && (
            <div className="pagination-controls">
              <button
                  disabled={suggestedMatchesPagination.currentPage === 1}
                  onClick={() => handleSearch(suggestedMatchesPagination.currentPage - 1)}
              >
                Previous
              </button>
              <span>
            Page {suggestedMatchesPagination.currentPage} of {suggestedMatchesPagination.totalPages}
          </span>
              <button
                  disabled={suggestedMatchesPagination.currentPage === suggestedMatchesPagination.totalPages}
                  onClick={() => handleSearch(suggestedMatchesPagination.currentPage + 1)}
              >
                Next
              </button>
            </div>
        )}
      </div>
  );
};

export default DirectSearchPage;