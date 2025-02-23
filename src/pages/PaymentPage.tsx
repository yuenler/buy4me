// src/pages/PaymentPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();

  // testSendPayPalRequest.js
  const { default: handler } = require("../api/sendPayPalRequest"); // Adjust the path if needed
  const httpMocks = require("node-mocks-http");

  async function test() {
    // Create a mock request object
    const req = httpMocks.createRequest({
      method: "POST",
      url: "/api/sendPayPalRequest",
      body: {
        recipientEmail: "email@email.com",
        recipientPhone: "1234567890",
        amount: 1,
      },
    });

    // Create a mock response object
    const res = httpMocks.createResponse();

    // Call your function
    await handler(req, res);

    // Log the results
    console.log("Status Code:", res.statusCode);
    console.log("Response Body:", res._getData());
  }

  test().catch(console.error);

  const handleSendPayPalRequest = async () => {
    try {
      const recipientEmail = "email@email.com";
      const recipientPhone = "1234567890"; // not used in this example, but available if needed
      const amount = 1; // $1 request

      const payload = { recipientEmail, recipientPhone, amount };

      const response = await fetch("/api/sendPayPalRequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${errorText}`);
      }
      const result = await response.json();
      alert("PayPal request sent successfully!");
    } catch (error) {
      console.error("Error sending PayPal request:", error);
      alert("Failed to send PayPal request");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <button
        onClick={handleSendPayPalRequest}
        className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition"
      >
        Send $1 via PayPal
      </button>
    </div>
  );
};

export default PaymentPage;
