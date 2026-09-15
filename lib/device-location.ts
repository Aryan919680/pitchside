import type { Coordinate } from "./venues";

// Call only in response to the visitor's location-button click.
export function requestDeviceLocation(): Promise<Coordinate> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location access isn't supported in this browser. Search for your area instead."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      error => reject(new Error(error.code === 1
        ? "Location access was declined. Enter your area in the search box."
        : "Your location couldn't be found. Try searching for an area instead.")),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  });
}
