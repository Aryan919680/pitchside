"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {ArrowDownUp,ArrowUpRight,ChevronRight,Clock3,Compass,Grid2X2,Info,Layers,LocateFixed,Map as MapIcon,MapPin,Navigation,Phone,Search,Star,Trees,TriangleAlert,X,LoaderCircle,Globe,ScanLine} from "lucide-react";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from "@/components/ui/dialog";
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription} from "@/components/ui/sheet";
import {Skeleton} from "@/components/ui/skeleton";
import {CATEGORY_LABELS,DEFAULT_CENTER,DEMO_VENUES,distanceKm,directionsUrl,safeUrl,type Category,type Coordinate,type Credit,type Venue} from "@/lib/venues";
import {fetchVenueDetails,googleMaps,resolveLocation,searchVenues} from "@/lib/google-maps";

import {ensureMapsSession,invalidateMapsSession,MAPS_UNAVAILABLE} from "@/lib/maps-session";
import {requestDeviceLocation} from "@/lib/device-location";

const categoryIcons={all:Grid2X2,turf:ScanLine,ground:Trees,nets:Layers};
function Credits({credits}: {credits?:Credit[]}) {
  return credits?.length ? <div className="credit">Photo: {credits.map((a,i)=><span key={i}>{i>0?", ":""}{safeUrl(a.url)?<a href={safeUrl(a.url)} target="_blank" rel="noreferrer">{a.name}</a>:a.name}</span>)}</div>:null;
}
function VenueImage({venue,className=""}:{venue:Venue;className?:string}) {
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[venue.image]);
  return <div className={"venue-photo "+className}>{venue.image&&!failed?<img src={venue.image} alt={venue.demo?"Illustrative cricket venue photo":venue.name} onError={()=>setFailed(true)} loading="lazy"/>:<div className="photo-fallback"><Trees size={28}/><span>Photo unavailable</span></div>}<span className="type-badge">{venue.demo?CATEGORY_LABELS[venue.category]:"Cricket venue"}</span></div>;
}
function VenueCard({venue,center,onSelect,selected}:{venue:Venue;center:Coordinate;onSelect:(v:Venue)=>void;selected:boolean}) {
  return <article className={"venue-card "+(selected?"is-selected":"")}>
    <VenueImage venue={venue}/>
    <div className="venue-content">
      <button className="venue-title" onClick={()=>onSelect(venue)}>{venue.name}</button>
      <div className="venue-address"><MapPin size={12}/><span title={venue.address}>{venue.address}</span></div>
      <div className="rating-row"><Star size={13} fill="#7c9648" stroke="#7c9648"/><strong>{venue.rating?.toFixed(1)??"Rating unavailable"}</strong>{venue.reviews!==undefined&&<span>({venue.reviews})</span>}<span className="distance"><Navigation size={11}/>{distanceKm(center,venue.location).toFixed(1)} km</span></div>
      <div className="tags">{venue.tags.slice(0,3).map(tag=><span className="tag" key={tag}>{tag}</span>)}</div>
      <div className="card-footer"><span className={"status "+(venue.open===false?"closed":venue.open===undefined?"unknown":"")}><Clock3 size={12}/>{venue.open===true?"Open now":venue.open===false?"Closed now":"Check opening hours"}</span><button className="detail-button" onClick={()=>onSelect(venue)}>View details<ArrowUpRight size={13}/></button></div>
      {!venue.demo&&<><Credits credits={venue.credits}/>{venue.attributions?.map((a,i)=><a className="credit" key={i} href={safeUrl(a.url)} target="_blank" rel="noreferrer">{a.name}</a>)}</>}
    </div>
  </article>;
}

function MapPanel({live,center,label,venues,selectedId,onSelect,onSearchArea,mapId}:{live:boolean;center:Coordinate;label:string;venues:Venue[];selectedId?:string;onSelect:(v:Venue)=>void;onSearchArea:(p:Coordinate)=>void;mapId:string}) {
  const host=useRef<HTMLDivElement>(null);
  const map=useRef<any>(null);
  const [ready,setReady]=useState(false);
  const [moved,setMoved]=useState(false);
  const [mapError,setMapError]=useState("");
  const [satellite,setSatellite]=useState(false);
  const selectRef=useRef(onSelect);selectRef.current=onSelect;
  useEffect(()=>{
    if(!live||!host.current)return;
    let cancelled=false;
    let listener:any;
    setMapError("");
    googleMaps().importLibrary("maps").then(({Map}:any)=>{
      if(cancelled)return;
      map.current=new Map(host.current,{center,zoom:14,mapId:mapId||"DEMO_MAP_ID",disableDefaultUI:true,zoomControl:true,gestureHandling:"cooperative",clickableIcons:false});
      listener=map.current.addListener("dragend",()=>setMoved(true));
      setReady(true);
    }).catch(()=>setMapError("The map could not load. You can still explore the venue list."));
    return ()=>{cancelled=true;listener?.remove();map.current=null;setReady(false);};
  },[live,mapId]);
  useEffect(()=>{if(ready&&map.current){map.current.panTo(center);setMoved(false);}},[center,ready]);
  useEffect(()=>{
    if(!ready||!map.current)return;
    let cancelled=false;
    const markers:any[]=[];
    googleMaps().importLibrary("marker").then(({AdvancedMarkerElement}:any)=>{
      if(cancelled||!map.current)return;
      for(const [i,v] of venues.entries()){
        const content=document.createElement("button");content.className="map-pin "+(v.id===selectedId?"selected":"");
        content.textContent=v.rating?"★ "+v.rating.toFixed(1):String(i+1);
        content.setAttribute("aria-label",v.name);
        content.onclick=()=>selectRef.current(v);
        const marker=new AdvancedMarkerElement({map:map.current,position:v.location,title:v.name,content,zIndex:v.id===selectedId?10:1});
        markers.push(marker);
      }
    }).catch(()=>setMapError("Map pins could not load. Select a venue from the list."));
    return ()=>{cancelled=true;markers.forEach(m=>m.map=null);};
  },[venues,ready,selectedId]);
  useEffect(()=>{const selected=venues.find(v=>v.id===selectedId);if(selected&&map.current)map.current.panTo(selected.location);},[selectedId,venues]);
  const embed="https://maps.google.com/maps?q="+encodeURIComponent(label==="Current location"?center.lat+","+center.lng:"Indiranagar, Bengaluru")+"&z=14&output=embed";
  return <section className="map-panel" aria-label="Nearby cricket venue map">
    {live?<div ref={host} className="map-host"/>:<iframe className="map-embed" src={embed} title="Google Maps neighborhood preview" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"/>}
    <div className="map-top"><div className="map-location"><MapPin size={16}/><span>{live?label:"Indiranagar, Bengaluru"}</span></div>{live&&<button className="map-icon" aria-label={satellite?"Switch to road map":"Switch to satellite map"} onClick={()=>{setSatellite(!satellite);map.current?.setMapTypeId(satellite?"roadmap":"satellite");}}><Layers size={17}/></button>}</div>
    {live&&moved&&<div className="map-bottom"><button className="secondary-button" onClick={()=>{const p=map.current?.getCenter()?.toJSON();if(p){onSearchArea(p);setMoved(false);}}}><Search size={14}/>Search this area</button></div>}
    {!live&&<div className="map-notice"><div className="notice-icon"><Compass size={24}/></div><div><h3>Explore the neighborhood</h3><p>Sample listings are shown while live venue search is unavailable.</p></div></div>}
    {mapError&&<div className="map-notice" role="alert"><TriangleAlert size={18}/><p>{mapError}</p></div>}
    {live&&!ready&&!mapError&&<div className="map-notice"><LoaderCircle className="animate-spin" size={18}/><p>Loading your map…</p></div>}
  </section>;
}

export default function Pitchside() {
  const [query,setQuery]=useState("Indiranagar, Bengaluru");
  const [label,setLabel]=useState("Indiranagar, Bengaluru");
  const [center,setCenter]=useState<Coordinate>(DEFAULT_CENTER);
  const [category,setCategory]=useState<Category>("all");
  const [radius,setRadius]=useState("5");
  const [openOnly,setOpenOnly]=useState(false);
  const [topRated,setTopRated]=useState(false);
  const [sort,setSort]=useState("distance");
  const [venues,setVenues]=useState<Venue[]>(DEMO_VENUES);
  const [live,setLive]=useState(false);
  const [connecting,setConnecting]=useState(true);
  const [loading,setLoading]=useState(false);
  const [locating,setLocating]=useState(false);
  const [error,setError]=useState("");
  const [connectedDemoKey,setConnectedDemoKey]=useState(false);
  const [mapId,setMapId]=useState("");
  const [mobileMap,setMobileMap]=useState(false);
  const [selected,setSelected]=useState<Venue|null>(null);
  const [detailsOpen,setDetailsOpen]=useState(false);
  const [detailsLoading,setDetailsLoading]=useState(false);
  const [detailsError,setDetailsError]=useState("");
  const [creditsOpen,setCreditsOpen]=useState(false);
  const mounted=useRef(true);
  const mapsApplied=useRef(false);
  const searchRef=useRef<HTMLInputElement>(null);
  const requestSeq=useRef(0);
  const locationSeq=useRef(0);
  const detailsSeq=useRef(0);
  const visible=useMemo(()=>venues.filter(v=>(live||category==="all"||v.category===category)&&(!openOnly||v.open===true)&&(!topRated||(v.rating??0)>=4.5)&&distanceKm(center,v.location)<=Number(radius)).sort((a,b)=>sort==="rating"?(b.rating??0)-(a.rating??0):distanceKm(center,a.location)-distanceKm(center,b.location)),[venues,category,openOnly,topRated,sort,center,radius,live]);

  const ensureMaps=useCallback(async()=>{
    const config=await ensureMapsSession();
    if(mounted.current&&!mapsApplied.current){
      mapsApplied.current=true;
      setMapId(config.mapId);setConnectedDemoKey(config.demoKey);
      if(config.demoKey){setTopRated(false);setSort("distance");}
      setVenues([]);setLive(true);setError(previous=>previous===MAPS_UNAVAILABLE?"":previous);
    }
    return config;
  },[]);
  useEffect(()=>{
    mounted.current=true;
    void ensureMaps().catch(()=>{}).finally(()=>{if(mounted.current)setConnecting(false);});
    const onAuth=()=>{
      invalidateMapsSession();mapsApplied.current=false;requestSeq.current++;locationSeq.current++;
      setLive(false);setVenues(DEMO_VENUES);setCenter(DEFAULT_CENTER);
      setLabel("Indiranagar, Bengaluru");setQuery("Indiranagar, Bengaluru");
      setLoading(false);setLocating(false);setConnecting(false);setError(MAPS_UNAVAILABLE);
    };
    window.addEventListener("pitchside-map-auth-error",onAuth);
    return ()=>{mounted.current=false;window.removeEventListener("pitchside-map-auth-error",onAuth);};
  },[ensureMaps]);
  useEffect(()=>{
    if(!live)return;
    const request=++requestSeq.current;
    setLoading(true);setVenues([]);
    searchVenues(center,category,Number(radius),openOnly).then(result=>{if(request===requestSeq.current)setVenues(result);}).catch(()=>{if(request===requestSeq.current)setError("We couldn't retrieve venues. Please try again shortly.");}).finally(()=>{if(request===requestSeq.current)setLoading(false);});
    return ()=>{requestSeq.current++;};
  },[live,center,category,radius,openOnly]);
  async function searchLocation() {
    if(!query.trim()){setError("Enter an area, city or postcode.");searchRef.current?.focus();return;}
    const seq=++locationSeq.current;
    setLocating(true);setError("");
    try {await ensureMaps();if(seq!==locationSeq.current||!mounted.current)return;const result=await resolveLocation(query.trim());if(seq===locationSeq.current){setCenter(result.center);setLabel(result.label);}}
    catch(e){if(seq===locationSeq.current)setError(e instanceof Error?e.message:"Location search failed.");}
    finally{if(seq===locationSeq.current)setLocating(false);}
  }
  async function locate() {
    const seq=++locationSeq.current;
    setLocating(true);setError("");
    try {
      // Request browser permission on the click; Maps startup runs alongside it.
      const [position]=await Promise.all([requestDeviceLocation(),ensureMaps()]);
      if(seq!==locationSeq.current||!mounted.current)return;
      setCenter(position);setLabel("Current location");setQuery("");
    } catch(e) {
      if(seq===locationSeq.current&&mounted.current)setError(e instanceof Error?e.message:MAPS_UNAVAILABLE);
    } finally {
      if(seq===locationSeq.current&&mounted.current)setLocating(false);
    }
  }
  const selectVenue=useCallback(async(v:Venue)=>{
    const seq=++detailsSeq.current;
    setSelected(v);setDetailsOpen(true);setDetailsError("");
    if(v.demo){setDetailsLoading(false);return;}
    setDetailsLoading(true);
    try{const details=await fetchVenueDetails(v);if(seq===detailsSeq.current)setSelected(details);}
    catch{if(seq===detailsSeq.current)setDetailsError("More details are unavailable. Open this venue in Google Maps.");}
    finally{if(seq===detailsSeq.current)setDetailsLoading(false);}
  },[]);
  function resetFilters(){setCategory("all");setRadius("5");setOpenOnly(false);setTopRated(false);}

  // Read the exact result set shown in the UI. Unsupported browsers simply omit this tool.
  const resultRef=useRef({visible,live,label,radius});resultRef.current={visible,live,label,radius};
  useEffect(()=>{
    const context=(document as any).modelContext;if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    try {Promise.resolve(context.registerTool({name:"get_visible_cricket_venues",title:"Read visible cricket venues",description:"Read the cricket venues currently displayed, including whether these are demo examples. Does not confirm booking availability.",inputSchema:{type:"object",properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute(input:unknown){if(input===null||typeof input!=="object"||Array.isArray(input)||Object.keys(input).length)throw new Error("Expected an empty object.");const r=resultRef.current;return {demo:!r.live,area:r.label,radiusKm:Number(r.radius),bookingAvailability:"Contact venue",venues:r.visible.map(v=>({id:v.id,name:v.name,address:v.address,rating:v.rating,openNow:v.open}))};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
    return ()=>lifecycle.abort();
  },[]);

  return <div className="page-shell">
    <header className="site-header"><a href="/" className="brand" aria-label="Pitchside home"><img src="/favicon.svg" alt=""/>pitchside<span className="text-[#86a764]">.</span></a><nav className="header-nav" aria-label="Main navigation"><span className="nav-active"><Compass size={16}/>Explore grounds</span></nav><button className="location-label" onClick={()=>searchRef.current?.focus()}><MapPin size={16}/>{label}<ChevronRight size={14}/></button><button className="location-button" onClick={locate} disabled={locating}>{locating?<LoaderCircle className="animate-spin" size={16}/>:<LocateFixed size={16}/>}Use my location</button></header>
    <main>
      <div className="intro-row"><div><p className="eyebrow">Less searching. More playing.</p><h1>Your next innings <em>starts here.</em></h1><p className="intro-sub">Find your kind of cricket ground, just around the corner.</p></div><div className="cricket-label"><span className="text-lg">✳</span> Made for the love of cricket</div></div>
      <form className="search-bar" onSubmit={e=>{e.preventDefault();void searchLocation();}}><label className="search-field"><Search size={20}/><span className="sr-only">Search area, city or postcode</span><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Enter area, city or postcode" maxLength={200}/>{query&&<button type="button" onClick={()=>{setQuery("");searchRef.current?.focus();}} aria-label="Clear location"><X size={15}/></button>}</label><Select value={radius} onValueChange={setRadius}><SelectTrigger aria-label="Search radius" className="h-11 border-0 border-l rounded-none shadow-none px-4 text-[#62705a]"><SelectValue/></SelectTrigger><SelectContent>{["2","5","10","25","50"].map(n=><SelectItem value={n} key={n}>Within {n} km</SelectItem>)}</SelectContent></Select><button className="primary-button" type="submit" disabled={locating}>{locating?<LoaderCircle className="animate-spin" size={17}/>:<Search size={17}/>}<span className="search-label">Find grounds</span></button></form>
      <div className="filter-row"><div className="categories" role="group" aria-label="Venue type">{(Object.keys(CATEGORY_LABELS) as Category[]).map(c=>{const Icon=categoryIcons[c];return <button key={c} className={"category "+(c===category?"active":"")} aria-pressed={c===category} onClick={()=>setCategory(c)}><Icon size={15}/>{CATEGORY_LABELS[c]}</button>;})}</div><div className="filter-options"><label className="open-filter" htmlFor="open-now"><Switch id="open-now" checked={openOnly} onCheckedChange={setOpenOnly}/>Open now</label><button className={"category "+(topRated?"active":"")} disabled={live&&connectedDemoKey} title={live&&connectedDemoKey?"Ratings are unavailable":undefined} aria-pressed={topRated} onClick={()=>setTopRated(!topRated)}><Star size={14}/>4.5+ rated</button></div></div>
      {!live?<div className="demo-strip"><span><strong>{connecting?"LOADING NEARBY SEARCH":"YOU’RE EXPLORING A DEMO"}</strong>Sample venues, ratings and photos.</span></div>:<div className="demo-strip"><span><strong>VENUES FROM GOOGLE MAPS</strong>Contact the venue to confirm booking slots.</span></div>}
      {error&&<div className="alert" role="alert"><TriangleAlert size={17} className="shrink-0 mt-0.5"/><span className="flex-1">{error}</span><button aria-label="Dismiss message" onClick={()=>setError("")}><X size={16}/></button></div>}
      <div className={"workspace "+(mobileMap?"mobile-map":"")}>
        <section className="results" aria-label="Cricket venues"><div className="results-top"><h2>{loading?"Finding grounds…":live?"Grounds near you":"Explore nearby grounds"}<span aria-live="polite">{!loading&&"("+visible.length+")"}</span></h2><div className="sort-control"><span>Sort by:</span><Select value={sort} onValueChange={setSort}><SelectTrigger className="border-0 shadow-none text-xs px-1 gap-2 h-8 font-semibold text-[#526d47]" aria-label="Sort venues"><ArrowDownUp size={12}/><SelectValue/></SelectTrigger><SelectContent><SelectItem value="distance">Nearest first</SelectItem><SelectItem value="rating" disabled={live&&connectedDemoKey}>Highest rated</SelectItem></SelectContent></Select></div></div>
          {loading?<div aria-label="Loading venues">{[0,1,2].map(n=><div className="venue-card" key={n}><Skeleton className="w-40 h-40 rounded-xl shrink-0"/><div className="flex-1 space-y-4 py-3"><Skeleton className="h-5 w-3/4"/><Skeleton className="h-3 w-full"/><Skeleton className="h-3 w-1/2"/><Skeleton className="h-8 w-2/3"/></div></div>)}</div>:visible.length?<div>{visible.map(v=><VenueCard key={v.id} venue={v} center={center} onSelect={selectVenue} selected={selected?.id===v.id}/>)}</div>:<div className="empty-state"><Search size={32}/><h3>{error?"Let’s try that again":"No grounds found"}</h3><p>{error?"The venue search didn’t finish. Try again when your connection and Maps access are ready.":"Try a larger search radius or remove a filter to find more places to play."}</p><button className="secondary-button" onClick={()=>{if(error){setError("");void ensureMaps().then(()=>setCenter({...center})).catch(()=>setError(MAPS_UNAVAILABLE));}else resetFilters();}}>{error?"Retry search":"Reset filters"}</button></div>}
          <p className="results-foot">{live?"Venue information from Google Maps.":"Illustrative demo listings."} Distances are straight-line estimates.</p>
        </section>
        <MapPanel live={live} center={center} label={label} venues={live?visible:[]} selectedId={selected?.id} onSelect={selectVenue} onSearchArea={p=>{locationSeq.current++;setCenter(p);setLabel("Selected map area");setQuery("");}} mapId={mapId}/>
      </div>
      <footer className="site-footer"><div>© {new Date().getFullYear()} Pitchside <span className="mx-2">·</span> Every neighborhood has a good game.</div><span>{!live&&<button onClick={()=>setCreditsOpen(true)} className="text-action mr-5">Photo credits</button>}Find a pitch. Bring your people.</span></footer>
    </main>
    <button className="mobile-toggle" onClick={()=>setMobileMap(!mobileMap)}>{mobileMap?<Grid2X2 size={16}/>:<MapIcon size={16}/>} {mobileMap?"Show grounds":"Show map"}</button>

    <Sheet open={detailsOpen} onOpenChange={open=>{setDetailsOpen(open);if(!open)detailsSeq.current++;}}><SheetContent className="w-full sm:max-w-[500px] overflow-y-auto gap-0">
      {selected&&<><SheetHeader className="p-7 pb-5"><p className="eyebrow">{selected.demo?"Sample venue":"Cricket venue"}</p><SheetTitle className="text-2xl tracking-tight leading-tight">{selected.name}</SheetTitle><SheetDescription className="leading-6 pt-2">{selected.address}</SheetDescription></SheetHeader><div className="px-7"><VenueImage venue={selected} className="!w-full !min-w-0 !h-60"/>{!selected.demo&&<Credits credits={selected.credits}/>}<div className="rating-row text-sm my-4"><Star size={15} fill="#7c9648" stroke="#7c9648"/><strong>{selected.rating??"No rating"}</strong>{selected.reviews!==undefined&&<span>({selected.reviews} reviews)</span>}<span className="distance">{distanceKm(center,selected.location).toFixed(1)} km away</span></div><div className="tags mb-6">{selected.tags.map(tag=><span className="tag !text-xs" key={tag}>{tag}</span>)}</div>
        {selected.demo?<div className="rounded-xl bg-[#f0f5e9] p-5 mb-7"><h3 className="font-semibold mb-2 flex items-center gap-2"><Info size={17}/>Sample venue</h3><p className="text-sm leading-6 text-muted-foreground">This is a fictional venue with illustrative photos and sample ratings. It cannot be contacted or booked.</p><button className="text-action block mt-4" onClick={()=>setCreditsOpen(true)}>View photo credits</button></div>:<>
          <div className="border-t border-b py-5"><h3 className="font-semibold flex items-center gap-2 mb-3"><Clock3 size={17}/>Opening hours</h3>{detailsLoading?<p className="text-sm text-muted-foreground">Getting venue details…</p>:selected.hours?.length?<ul className="space-y-2 text-sm text-muted-foreground">{selected.hours.map(h=><li key={h}>{h}</li>)}</ul>:<p className="text-sm text-muted-foreground">Hours not provided. Check with the venue.</p>}</div>
          <div className="py-5"><h3 className="font-semibold mb-2">Ready to play?</h3><p className="text-sm leading-6 text-muted-foreground mb-4">Contact the venue to confirm cricket facilities, prices and available time slots.</p>{detailsError&&<p role="alert" className="text-sm text-destructive mb-4">{detailsError}</p>}<a className="primary-button w-full" href={directionsUrl(selected)} target="_blank" rel="noreferrer"><Navigation size={16}/>Get directions</a><div className="grid grid-cols-2 gap-2 mt-3">{selected.phone&&<a className="secondary-button" href={"tel:"+selected.phone.replace(/[^+\d]/g,"")}><Phone size={15}/>Call venue</a>}{safeUrl(selected.website)&&<a className="secondary-button" href={safeUrl(selected.website)} target="_blank" rel="noreferrer"><Globe size={15}/>Website</a>}</div>{safeUrl(selected.mapsUrl)&&<a className="credit block mt-4 underline" href={safeUrl(selected.mapsUrl)} target="_blank" rel="noreferrer">View on Google Maps ↗</a>}</div>
        </>}</div></>}
    </SheetContent></Sheet>
    <Dialog open={creditsOpen} onOpenChange={setCreditsOpen}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Demo photo credits</DialogTitle><DialogDescription>These illustrative photos are not photos of the fictional venues.</DialogDescription></DialogHeader><div className="credit space-y-4"><p>Green ground: <a href="https://unsplash.com/photos/mUtQXjjLPbw" target="_blank" rel="noreferrer">Marcus Wallis / Unsplash</a>.</p><p>Outdoor artificial nets: <a href="https://commons.wikimedia.org/wiki/File:Dunmow_Cricket_Club_cricket_practice_nets,_Great_Dunmow,_Essex,_England_01.jpg" target="_blank" rel="noreferrer">Acabashi / Wikimedia Commons</a>.</p><p>Indoor nets: <a href="https://commons.wikimedia.org/wiki/File:Cricket_nets_at_Cluny_Clays.jpeg" target="_blank" rel="noreferrer">CallumSpence / Wikimedia Commons</a>.</p><p>Wikimedia photos are licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. Images are resized and cropped for display.</p></div></DialogContent></Dialog>
  </div>;
}
