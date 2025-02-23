// testSendPayPalRequest.js
const { default: handler } = require("../api/sendPayPalRequest"); // Adjust the path if needed
const httpMocks = require("node-mocks-http");

async function testPayPal() {
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

testPayPal().catch(console.error);

export {};
