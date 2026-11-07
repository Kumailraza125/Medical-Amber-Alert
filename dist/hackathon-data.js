// Invented training examples only. These are not historical clinical data.
export const profiles = [
 {id:'demo-001',fullName:'DEMO Avery Morgan',personalHealthNumber:'DEMO-PHN-0001',contactInfo:'avery@example.test',injuryOrIllness:'Fictional leg injury after a fall',medicalBackground:'Synthetic example: no known conditions',resource:'X-ray'},
 {id:'demo-002',fullName:'DEMO Jordan Chen',personalHealthNumber:'DEMO-PHN-0002',contactInfo:'jordan@example.test',injuryOrIllness:'Fictional imaging referral',medicalBackground:'Synthetic example: previous knee injury',resource:'MRI'},
 {id:'demo-003',fullName:'DEMO Riley Singh',personalHealthNumber:'DEMO-PHN-0003',contactInfo:'riley@example.test',injuryOrIllness:'Fictional breathing concern',medicalBackground:'Synthetic example: respiratory history',resource:'ICU beds'},
 {id:'demo-004',fullName:'DEMO Casey Park',personalHealthNumber:'DEMO-PHN-0004',contactInfo:'casey@example.test',injuryOrIllness:'Fictional abdominal imaging referral',medicalBackground:'Synthetic example: no known allergies',resource:'Ultrasound'},
 {id:'demo-005',fullName:'DEMO Taylor Brooks',personalHealthNumber:'DEMO-PHN-0005',contactInfo:'taylor@example.test',injuryOrIllness:'Fictional head imaging referral',medicalBackground:'Synthetic example: previous migraine',resource:'CT scan'},
];
export const crews = [
 {id:'crew-cedar',name:'Cedar demo ambulance crew',hospitalId:'cedar',role:'Paramedic crew',status:'Available',hoursWorked:5},
 {id:'crew-maple',name:'Maplewood demo transfer crew',hospitalId:'maple',role:'Paramedic crew',status:'Available',hoursWorked:13},
 {id:'nurse-river',name:'DEMO River clinic nurse',hospitalId:'riverside',role:'Clinic nurse',status:'On call',hoursWorked:4},
 {id:'doctor-north',name:'DEMO North on-call doctor',hospitalId:'north',role:'On-call doctor',status:'Off shift',hoursWorked:8},
];
export const screeningVersion='demo-rules-v1';
export function screen(answers){
 const reasons=[];let priority='Routine',minutes=120;
 if(answers.breathingConcern)reasons.push('Breathing-concern answer selected');
 if(answers.unresponsive)reasons.push('Unresponsive answer selected');
 if(answers.majorBleeding)reasons.push('Major-bleeding answer selected');
 if(reasons.length){priority='Critical';minutes=10;}
 else if(answers.pain>=7){priority='Urgent';minutes=30;reasons.push('Demo discomfort score is 7 or higher');}
 else reasons.push('No high-priority demo answers were selected');
 return {priority,minutes,reasons,version:screeningVersion,notice:'Illustrative rules only. Not trained AI, diagnosis, clinical triage or a safe waiting-time recommendation. A qualified clinician must decide real urgency.'};
}
