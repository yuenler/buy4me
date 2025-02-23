import React from "react";
import FriendMap from "../components/FriendMap"; // Adjust path if needed

const FriendMapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F2E8CF] flex flex-col items-center p-6">
      {/* Page Title */}
      <h1 className="text-4xl font-extrabold text-[#386641] text-center mb-2">Friend Map</h1>

      {/* Friend Map Component (Full Width, No Box Around It) */}
      <div className="w-full">
        <FriendMap />
      </div>
    </div>
  );
};

export default FriendMapPage;
