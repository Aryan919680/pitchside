export type Category = "all" | "turf" | "ground" | "nets";
export type Coordinate = {lat: number; lng: number};
export type Credit = {name: string; url?: string};
export type Venue = {
  id: string; name: string; address: string; category: Category; location: Coordinate;
  rating?: number; reviews?: number; open?: boolean; image?: string;
  credits?: Credit[]; attributions?: Credit[]; tags: string[]; demo?: boolean;
  hours?: string[]; phone?: string; website?: string; mapsUrl?: string;
};
export const DEFAULT_CENTER = {lat:12.9784, lng:77.6408};
export const CATEGORY_LABELS: Record<Category,string> = {all:"All grounds",turf:"Box cricket",ground:"Cricket grounds",nets:"Practice nets"};
export const DEMO_VENUES: Venue[] = [
  {id:"demo-1",name:"Boundary Box Cricket",address:"Indiranagar, Bengaluru",category:"turf",location:{lat:12.974,lng:77.644},rating:4.8,reviews:124,open:true,image:"/images/turf.jpg",tags:["Artificial turf","Floodlights","Box cricket"],demo:true},
  {id:"demo-2",name:"The Green Oval",address:"Domlur, Bengaluru",category:"ground",location:{lat:12.961,lng:77.639},rating:4.7,reviews:86,open:true,image:"/images/ground.jpg",tags:["Natural grass","Full-size ground"],demo:true},
  {id:"demo-3",name:"Six & Out Sports Arena",address:"HAL 2nd Stage, Bengaluru",category:"turf",location:{lat:12.967,lng:77.656},rating:4.6,reviews:203,open:true,image:"/images/turf.jpg",tags:["Artificial turf","Evening cricket"],demo:true},
  {id:"demo-4",name:"Crease Practice Nets",address:"Jeevan Bima Nagar, Bengaluru",category:"nets",location:{lat:12.969,lng:77.665},rating:4.5,reviews:59,open:false,image:"/images/nets.jpg",tags:["Practice nets","Bowling practice"],demo:true},
  {id:"demo-5",name:"Eastside Cricket Ground",address:"CV Raman Nagar, Bengaluru",category:"ground",location:{lat:12.984,lng:77.674},rating:4.3,reviews:71,open:true,image:"/images/ground.jpg",tags:["Natural grass","Outdoor cricket"],demo:true},
  {id:"demo-6",name:"The Pavilion Nets",address:"Old Airport Road, Bengaluru",category:"nets",location:{lat:12.95,lng:77.659},rating:4.9,reviews:42,open:true,image:"/images/nets.jpg",tags:["Practice nets","Outdoor cricket"],demo:true},
];
export function distanceKm(a:Coordinate,b:Coordinate) {
  const rad=(n:number)=>n*Math.PI/180;
  const x=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}
export function safeUrl(raw?:string) {
  if(!raw)return undefined;
  try {const u=new URL(raw);return u.protocol==="https:"||u.protocol==="http:"?u.href:undefined;}catch{return undefined;}
}
export function directionsUrl(v:Venue) {
  return "https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(v.name)+"&destination_place_id="+encodeURIComponent(v.id);
}
