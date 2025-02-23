import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { auth, firestore } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const FriendMap: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendLocations, setFriendLocations] = useState<{ id: string; lat: number; lng: number }[]>([]);
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

        // Fetch full friend profiles
        if (userData.friends && Array.isArray(userData.friends)) {
          const friendPromises = userData.friends.map(async (friendId: string) => {
            const friendRef = doc(firestore, "profiles", friendId);
            const friendSnap = await getDoc(friendRef);
            
            if (friendSnap.exists()) {
              const friendData = friendSnap.data();
              
              console.log(`Friend Data (${friendId}):`, friendData); // 🔍 Debug: Print full friend profile

              if (friendData.location) {
                console.log(`Friend Location (${friendId}):`, friendData.location); // 🔍 Debug: Print location field
                return {
                  id: friendId,
                  username: friendData.username || "Unknown",
                  lat: friendData.location.latitude,
                  lng: friendData.location.longitude,
                };
              } else {
                console.warn(`⚠️ Friend (${friendId}) has no location field!`);
              }
            } else {
              console.warn(`❌ Friend (${friendId}) profile does not exist!`);
            }

            return null;
          });

          const friendData = (await Promise.all(friendPromises)).filter(Boolean);
          setFriends(friendData);

        // Extract only locations
        const friendLocs = friendData
            .filter((friend) => friend !== null)
            .map((friend) => ({
            id: friend?.id ?? "unknown", // ✅ Defaults to "unknown" if missing
            lat: friend?.lat ?? 0, // ✅ Defaults to 0
            lng: friend?.lng ?? 0, // ✅ Defaults to 0
            }));

          setFriendLocations(friendLocs);
        }
      } catch (error) {
        console.error("🚨 Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, [user]);

  return (
    <div className="p-4">
      {/* Debugging output for full friend objects */}
      <div className="p-4 bg-white shadow-md rounded mb-4">
        <h2 className="text-xl font-semibold text-[#386641]">Friends:</h2>
        {friends.length > 0 ? (
          friends.map((friend) => (
            <p key={friend.id} className="text-gray-800">
              <strong>{friend.username}</strong> (ID: {friend.id})
              <br />
              Location: {friend.lat && friend.lng ? `Lat: ${friend.lat}, Lng: ${friend.lng}` : "❌ No location available"}
            </p>
          ))
        ) : (
          <p className="text-gray-600">No friends found or no friends with locations.</p>
        )}
      </div>

      {/* Google Map */}
      <LoadScript googleMapsApiKey="AIzaSyC44tWWL0aaZOV_UCjeo8Qf7vFZXI6XHVE">
        {userLocation ? (
          <GoogleMap mapContainerStyle={mapContainerStyle} center={userLocation} zoom={13}>
            <Marker position={userLocation} label="You" />

            {/* Friends' Locations Markers */}
            {friendLocations.map((friend) => (
              <Marker key={friend.id} position={{ lat: friend.lat, lng: friend.lng }} label="F" />
            ))} 
          </GoogleMap>
        ) : (
          <p>Loading map...</p>
        )}
      </LoadScript>
    </div>
  );
};

export default FriendMap;
