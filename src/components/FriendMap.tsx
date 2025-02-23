import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Circle, InfoWindow } from "@react-google-maps/api";
import { auth, firestore } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

const mapContainerStyle = {
  width: "100%",
  height: "65vh",
  borderRadius: "12px",
};

// Function to calculate distance between two coordinates in miles
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 3958.8; // Radius of Earth in miles
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); // Return distance rounded to 1 decimal place
};

const FriendMap: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [friends, setFriends] = useState<
    { id: string; username: string; lat: number; lng: number; nearbyPlaces?: { id: string; name: string; distance: string }[] }[]
  >([]);

  // ✅ Ensure Firebase Auth is fully initialized before proceeding
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedInUser) => {
      setUser(loggedInUser);
      setFirebaseInitialized(true); // ✅ Firebase is now ready
    });

    return () => unsubscribe();
  }, []);

  // ✅ Fetch user & friends' locations **only after Firebase is initialized**
  useEffect(() => {
    if (!firebaseInitialized || !user) return;

    const fetchLocations = async () => {
      try {
        const userRef = doc(firestore, "profiles", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        if (userData.location) {
          setUserLocation({
            lat: userData.location.latitude,
            lng: userData.location.longitude,
          });
        }

        // Fetch friends' locations
        if (userData.friends && Array.isArray(userData.friends)) {
          const friendPromises = userData.friends.map(async (friendId: string) => {
            const friendRef = doc(firestore, "profiles", friendId);
            const friendSnap = await getDoc(friendRef);

            if (friendSnap.exists()) {
              const friendData = friendSnap.data();
              if (friendData.location) {
                return {
                  id: friendId,
                  username: friendData.username || "Unknown",
                  lat: friendData.location.latitude,
                  lng: friendData.location.longitude,
                  nearbyPlaces: [],
                };
              }
            }
            return null;
          });

          const friendData = (await Promise.all(friendPromises)).filter(Boolean) as {
            id: string;
            username: string;
            lat: number;
            lng: number;
            nearbyPlaces?: { id: string; name: string; distance: string }[];
          }[];

          setFriends(friendData);

          // Fetch nearby places for each friend
          friendData.forEach((friend) => {
            fetchPlacesForFriend(friend).then((places) => {
              setFriends((prev) =>
                prev.map((f) => (f.id === friend.id ? { ...f, nearbyPlaces: places.slice(0, 5) } : f))
              );
            });
          });
        }
      } catch (error) {
        console.error("🚨 Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, [firebaseInitialized, user]);

  const fetchPlacesForFriend = (friend: { lat: number; lng: number }) => {
    return new Promise<{ id: string; name: string; distance: string }[]>((resolve) => {
      const map = new window.google.maps.Map(document.createElement("div"));
      const service = new window.google.maps.places.PlacesService(map);

      const fetchType = (type: string) => {
        return new Promise<{ id: string; name: string; distance: string }[]>((resolve) => {
          const request = {
            location: { lat: friend.lat, lng: friend.lng },
            radius: 5000,
            type: type,
          };

          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              const places = results
                .map((place) => {
                  if (!place.place_id || !place.name || !place.geometry?.location) return null;

                  return {
                    id: place.place_id,
                    name: place.name,
                    distance: calculateDistance(
                      friend.lat,
                      friend.lng,
                      place.geometry.location.lat(),
                      place.geometry.location.lng()
                    ),
                  };
                })
                .filter((place): place is { id: string; name: string; distance: string } => place !== null)
                .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)) // ✅ Sort by closest first
                .slice(0, 5); // ✅ Only show top 5 places

              resolve(places);
            } else {
              resolve([]);
            }
          });
        });
      };

      Promise.all([fetchType("supermarket"), fetchType("restaurant")]).then(([supermarkets, restaurants]) => {
        resolve([...supermarkets, ...restaurants]); // Merge results
      });
    });
  };  

  return (
    <div className="min-h-screen bg-[#F2E8CF] p-6 flex flex-col items-center">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-6">
        {/* Friends Nearby List */}
        <div className="mb-4 bg-[#F2E8CF] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-[#6A994E]">Friends Are Close To:</h3>
          {friends.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {friends.map((friend) => (
                <li key={friend.id} className="text-[#386641]">
                  <strong>{friend.username}</strong> 🌍
                  {friend.nearbyPlaces && friend.nearbyPlaces.length > 0 && (
                    <ul className="mt-1 text-sm text-[#6A994E]">
                      {friend.nearbyPlaces.map((place) => (
                        <li key={place.id}>
                          • {place.name} ({place.distance} mi)
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 text-sm">No friends found nearby.</p>
          )}
        </div>

        
          {userLocation ? (
            <GoogleMap key={`${userLocation.lat}-${userLocation.lng}`} mapContainerStyle={mapContainerStyle} center={userLocation} zoom={13}>
              <Circle center={userLocation} radius={150} options={{ strokeColor: "#6A994E", fillColor: "#6A994E", strokeWeight: 1.5 }} />

              {friends.map((friend) => (
                <React.Fragment key={friend.id}>
                  <Circle center={{ lat: friend.lat, lng: friend.lng }} radius={200} options={{ strokeColor: "#BC4749", fillColor: "#BC4749", strokeWeight: 2 }} />
                  <InfoWindow position={{ lat: friend.lat, lng: friend.lng }} options={{ disableAutoPan: true }}>
                    <div className="p-1 text-[#BC4749] font-semibold text-sm">{friend.username}</div>
                  </InfoWindow>
                </React.Fragment>
              ))}
            </GoogleMap>
          ) : (
            <p className="text-center text-gray-700">Loading map...</p>
          )}

      </div>
    </div>
  );
};

export default FriendMap;
