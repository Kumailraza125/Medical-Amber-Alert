export const hospitals = [
 {id:'cedar',name:'Cedar Valley Community Hospital',short:'Cedar Valley',town:'Cedar Valley',lat:49.25,lng:-123.10,resources:['X-ray','Ultrasound','Blood & Lab Work','Cast/Stitches Support'],contact:'coordination@cedar.example.test'},
 {id:'maple',name:'Maplewood Regional Hospital',short:'Maplewood Regional',town:'Maplewood',lat:49.30,lng:-123.18,resources:['Ultrasound','CT scan','MRI','X-ray','Advanced Trauma Team','Blood & Lab Work','Cast/Stitches Support','Ventilator','ICU beds'],contact:'transfers@maple.example.test'},
 {id:'riverside',name:'Riverside Medical Centre',short:'Riverside Medical',town:'Riverside',lat:49.10,lng:-122.80,resources:['MRI','CT scan','Ultrasound','Blood & Lab Work','Cast/Stitches Support'],contact:'coordination@riverside.example.test'},
 {id:'north',name:'Northcrest General Hospital',short:'Northcrest General',town:'Northcrest',lat:49.62,lng:-122.80,resources:['ICU beds','Ventilator','X-ray','Advanced Trauma Team'],contact:'transfers@northcrest.example.test'},
 {id:'pine',name:'Pine Ridge Specialty Hospital',short:'Pine Ridge Specialty',town:'Pine Ridge',lat:49.80,lng:-122.40,resources:['MRI','Ventilator','ICU beds'],contact:'coordination@pineridge.example.test'},
 {id:'coast',name:'Coastal District Hospital',short:'Coastal District',town:'Coastal District',lat:50.5,lng:-123.2,resources:['MRI','CT scan','Ventilator'],contact:'transfers@coastal.example.test'},
 {id:'harbour',name:'Harbourview Island Hospital',short:'Harbourview Island',town:'Victoria area · sample site',lat:48.43,lng:-123.36,resources:['CT scan','X-ray','Ultrasound','Blood & Lab Work','Cast/Stitches Support'],contact:'coordination@harbour.example.test'},
 {id:'sequoia',name:'Sequoia Regional Hospital',short:'Sequoia Regional',town:'Nanaimo area · sample site',lat:49.17,lng:-123.94,resources:['MRI','X-ray','Ultrasound','ICU beds'],contact:'coordination@sequoia.example.test'},
 {id:'fraser',name:'Fraser East Medical Centre',short:'Fraser East',town:'Abbotsford area · sample site',lat:49.05,lng:-122.29,resources:['Advanced Trauma Team','CT scan','Blood & Lab Work','Cast/Stitches Support'],contact:'coordination@fraser.example.test'},
 {id:'summit',name:'Summit Valley Hospital',short:'Summit Valley',town:'Kamloops area · sample site',lat:50.67,lng:-120.33,resources:['MRI','CT scan','Ventilator','ICU beds'],contact:'coordination@summit.example.test'},
 {id:'okanagan',name:'Okanagan Lakes Hospital',short:'Okanagan Lakes',town:'Kelowna area · sample site',lat:49.89,lng:-119.49,resources:['X-ray','CT scan','Ultrasound','Blood & Lab Work','ICU beds'],contact:'coordination@okanagan.example.test'},
 {id:'cariboo',name:'Cariboo Regional Hospital',short:'Cariboo Regional',town:'Prince George area · sample site',lat:53.91,lng:-122.75,resources:['Advanced Trauma Team','MRI','ICU beds','Ventilator'],contact:'coordination@cariboo.example.test'},
 {id:'skeena',name:'Skeena Valley Medical Centre',short:'Skeena Valley',town:'Terrace area · sample site',lat:54.52,lng:-128.60,resources:['CT scan','X-ray','Blood & Lab Work'],contact:'coordination@skeena.example.test'},
 {id:'peace',name:'Peace Highlands Hospital',short:'Peace Highlands',town:'Dawson Creek area · sample site',lat:55.76,lng:-120.24,resources:['Ultrasound','X-ray','Blood & Lab Work','Cast/Stitches Support'],contact:'coordination@peace.example.test'}
];
export const resources=['Ultrasound','CT scan','MRI','X-ray','Advanced Trauma Team','Blood & Lab Work','Cast/Stitches Support','Ventilator','ICU beds'];
const now=Date.now();
export const seedRequests=[
 {id:'HC-1042',hospitalId:'cedar',resource:'MRI',urgency:'Urgent',radiusKm:100,note:'Seeking the next available MRI slot. Please confirm availability with our coordination team.',createdAt:now-8*60000,status:'Awaiting responses',responses:[{hospitalId:'maple',availabilityMinutes:30}]},
 {id:'HC-1041',hospitalId:'north',resource:'CT scan',urgency:'Critical',radiusKm:100,note:'CT imaging resource requested. Please provide your earliest available slot.',createdAt:now-16*60000,status:'Awaiting responses',responses:[]},
 {id:'HC-1040',hospitalId:'riverside',resource:'ICU beds',urgency:'Urgent',radiusKm:100,note:'Seeking one available ICU bed. Coordinate requirements before any transfer.',createdAt:now-29*60000,status:'Awaiting responses',responses:[]},
 {id:'HC-1039',hospitalId:'cedar',resource:'CT scan',urgency:'Routine',radiusKm:100,note:'A same-day imaging slot is requested.',createdAt:now-52*60000,status:'Accepted',acceptedHospitalId:'riverside',responses:[{hospitalId:'riverside',availabilityMinutes:60}]},
 {id:'HC-1038',hospitalId:'cedar',resource:'ICU beds',urgency:'Urgent',radiusKm:100,note:'Sample coordination request completed.',createdAt:now-115*60000,status:'Completed',acceptedHospitalId:'north',responses:[{hospitalId:'north',availabilityMinutes:45}]},
 {id:'HC-1037',hospitalId:'maple',resource:'Ultrasound',urgency:'Routine',radiusKm:100,note:'Looking for an afternoon ultrasound slot.',createdAt:now-38*60000,status:'Awaiting responses',responses:[]}
];
export function distance(a,b){const r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLng=(b.lng-a.lng)*r;const v=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLng/2)**2;return 6371*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));}
