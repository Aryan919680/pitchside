import { type Category, type Coordinate, type Venue, distanceKm } from "./venues";

// Keep the Google-owned runtime objects inside this adapter.
export function googleMaps(): any { return (window as any).google?.maps; }
let loading: Promise<void> | undefined;
let loadedKey = "";
let limitedKey = true;
export function configureKeyMode(demoKey:boolean) { limitedKey = demoKey; }
export function loadGoogleMaps(key:string):Promise<void> {
  if(loadedKey && loadedKey!==key) return Promise.reject(new Error("Refresh the page before connecting a different key."));
  if(loading)return loading;
  loadedKey=key;
  loading=new Promise((resolve,reject)=>{
    const w=window as any;
    const timeout=setTimeout(()=>fail("Google Maps took too long to respond. Check your connection and refresh to retry."),20000);
    const fail=(message:string)=>{clearTimeout(timeout);reject(new Error(message));};
    w.gm_authFailure=()=>{fail("Google Maps could not authorize this key. Check billing, enabled APIs and website restrictions.");window.dispatchEvent(new Event("pitchside-map-auth-error"));};
    w.pitchsideMapsReady=()=>{clearTimeout(timeout);resolve();};
    const script=document.createElement("script");
    const params=new URLSearchParams({key,v:"weekly",loading:"async",libraries:"places,marker",callback:"pitchsideMapsReady"});
    script.src="https://maps.googleapis.com/maps/api/js?"+params;
    script.async=true;script.onerror=()=>fail("Google Maps could not load. Check your connection and refresh to retry.");
    document.head.appendChild(script);
  });
  return loading;
}
export async function resolveLocation(query:string):Promise<{center:Coordinate;label:string}> {
  const {Place}=await googleMaps().importLibrary("places");
  const {places}=await Place.searchByText({textQuery:query,fields:["displayName","location","formattedAddress"],maxResultCount:1});
  if(!places[0]?.location)throw new Error("We couldn't find that area. Try a neighborhood and city, or a postcode.");
  return {center:places[0].location.toJSON(),label:places[0].displayName||query};
}
export async function searchVenues(center:Coordinate,category:Category,radius:number,openOnly:boolean):Promise<Venue[]> {
  const {Place}=await googleMaps().importLibrary("places");
  const queries:Record<string,string>={turf:"box cricket turf",ground:"cricket ground",nets:"cricket practice nets"};
  const kinds=category==="all"?["turf","ground","nets"]:[category];
  const results=await Promise.all(kinds.map(async(kind)=>{
    const {places}=await Place.searchByText({textQuery:queries[kind],locationBias:{center,radius:radius*1000},maxResultCount:20,isOpenNow:openOnly,
      fields:["id","displayName","formattedAddress","location","googleMapsURI","businessStatus","attributions",...(limitedKey?[]:["rating","userRatingCount","photos"])]});
    return places.filter((p:any)=>p.location&&p.businessStatus!=="CLOSED_PERMANENTLY"&&distanceKm(center,p.location.toJSON())<=radius).map((p:any):Venue=>({
      id:p.id,name:p.displayName||"Cricket venue",address:p.formattedAddress||"Address unavailable",location:p.location.toJSON(),category:kind as Category,
      rating:p.rating,reviews:p.userRatingCount,open:openOnly?true:undefined,
      image:p.photos?.[0]?.getURI({maxWidth:700,maxHeight:500}),
      credits:p.photos?.[0]?.authorAttributions?.map((a:any)=>({name:a.displayName,url:a.uri})),
      attributions:p.attributions?.map((a:any)=>({name:a.provider,url:a.providerURI})),
      tags:["Cricket venue"],mapsUrl:p.googleMapsURI,
    }));
  }));
  return [...new Map<string,Venue>(results.flat().map(v=>[v.id,v] as [string,Venue])).values()];
}
export async function fetchVenueDetails(venue:Venue):Promise<Venue> {
  const {Place}=await googleMaps().importLibrary("places");
  const place=new Place({id:venue.id});
  await place.fetchFields({fields:["regularOpeningHours","nationalPhoneNumber","websiteURI","googleMapsURI"]});
  return {...venue,hours:place.regularOpeningHours?.weekdayDescriptions,phone:place.nationalPhoneNumber,website:place.websiteURI,mapsUrl:place.googleMapsURI||venue.mapsUrl};
}
