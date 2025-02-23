import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Circle, InfoWindow } from "@react-google-maps/api";
import { auth, firestore } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const mapContainerStyle = {
  width: "100%",
  height: "65vh",
  borderRadius: "12px",
};

const FriendMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [friends, setFriends] = useState<{ id: string; username: string; lat: number; lng: number }[]>([]);
  const [openInfoWindows, setOpenInfoWindows] = useState<{ [key: string]: boolean }>({}); // Tracks which labels are open
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

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

        // Fetch friend profiles
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
          }[];

          setFriends(friendData);

          // Set all info windows to open initially
          const initialInfoState = Object.fromEntries(friendData.map((friend) => [friend.id, true]));
          setOpenInfoWindows(initialInfoState);
        }
      } catch (error) {
        console.error("🚨 Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F2E8CF] p-6 flex flex-col items-center">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-6">
        {/* Friends List */}
        <div className="mb-4 bg-[#F2E8CF] p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-[#6A994E]">Nearby Friends:</h3>
          {friends.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {friends.map((friend) => (
                <li key={friend.id} className="text-[#386641]">
                  <strong>{friend.username}</strong> 🌍 
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 text-sm">No friends found nearby.</p>
          )}
        </div>

        {/* Google Map */}
        <LoadScript googleMapsApiKey="AIzaSyC44tWWL0aaZOV_UCjeo8Qf7vFZXI6XHVE">
          {userLocation ? (
            <GoogleMap mapContainerStyle={mapContainerStyle} center={userLocation} zoom={13}>
              {/* User's Location as a Green Circle */}
              <Circle
                center={userLocation}
                radius={150}
                options={{
                  strokeColor: "#6A994E",
                  fillColor: "#6A994E",
                  strokeWeight: 1.5,
                }}
              />
              <InfoWindow position={userLocation}>
                <div className="p-1 text-[#6A994E] font-bold">You</div>
              </InfoWindow>

              {/* Friends' Locations with Clickable Labels */}
              {friends.map((friend) => (
                <React.Fragment key={friend.id}>
                  <Circle
                    center={{ lat: friend.lat, lng: friend.lng }}
                    radius={200}
                    options={{
                      strokeColor: "#BC4749",
                      fillColor: "#BC4749",
                      strokeWeight: 2,
                    }}
                    onClick={() => setOpenInfoWindows((prev) => ({ ...prev, [friend.id]: true }))}
                  />
                  {openInfoWindows[friend.id] && (
                    <InfoWindow
                      position={{ lat: friend.lat, lng: friend.lng }}
                      onCloseClick={() => setOpenInfoWindows((prev) => ({ ...prev, [friend.id]: false }))}
                      options={{ disableAutoPan: true }}
                    >
                      <div className="p-1 text-[#BC4749] font-semibold text-sm">{friend.username}</div>
                    </InfoWindow>
                  )}
                </React.Fragment>
              ))}
            </GoogleMap>
          ) : (
            <p className="text-center text-gray-700">Loading map...</p>
          )}
        </LoadScript>
      </div>
    </div>
  );
};

export default FriendMap;
