## Inspiration

Running errands is a routine part of life, yet it's often inefficient—how many times have you made a trip to the store only to find out later that a friend or family member was just there? At the same time, people want to help each other, but coordinating favors, payments, and logistics can be a hassle. Traditional delivery apps exist, but they often come with fees and lack the personal connection of simply asking someone you trust. Our inspiration came from this gap: what if there was a way to make errands more social, more efficient, and entirely seamless? Whether it’s grabbing groceries, picking up a coffee, or saving a friend from an unnecessary trip, Buy4Me makes lending a hand as easy as a tap.

## What it does

Buy4Me lets you seamlessly request favors from friends when they’re near stores, making it effortless to pick up something you need. Through the app, you can see when a friend is near a particular store and send them a quick request—like, "Hey, if you're passing by Harvard Square, could you grab me a coffee from Blank Street?"

Once your friend completes the purchase, Buy4Me uses AI to automatically detect the exact amount spent from their connected bank account. The app then simplifies the reimbursement process by allowing them to Venmo request you the precise amount from the transaction. If the total spent is higher than expected—perhaps because they combined your order with their own—Buy4Me’s AI will intelligently suggest a fair amount to request based on the shared purchase.

## How we built it

We built Buy4Me using React, Node.js, TypeScript, Firebase, Vercel, Plaid, and the OpenAI API. The React frontend makes it easy to add friends, link bank accounts, and send requests. Our serverless backend on Vercel connects to Plaid to detect purchases and uses OpenAI to match transactions with natural language requests and suggest fair reimbursements when multiple orders are combined. 

## Challenges we ran into

Integrating the Google Maps API was tricky, especially when rendering the dynamic friend map and fetching nearby stores. We ran into a rendering issue where location updates didn’t display properly when the page was reloaded, requiring lots of debugging time.

## Accomplishments that we're proud of

One of our biggest accomplishments is the novelty of our approach—we aren’t just another payment app like Zelle or Venmo, nor are we a traditional delivery service like Uber Eats or Grubhub. Instead, we introduce a smarter, socially integrated way to fulfill everyday needs by leveraging the existing movements of friends and family. If a friend is already near a store or restaurant, why make an extra trip yourself? Our platform turns proximity into opportunity, allowing users to request items from people they trust while automating payments seamlessly within the app.

## What we learned

We had never worked with the Plaid API before, so figuring out how to securely link bank accounts and detect purchases was a challenge. It took quite some time for us to get it to work.

## What's next for buy4me?

In the future, we envision Buy4Me as a replacement for Venmo, not just as a payment transfer app, but as a more social and functional alternative that integrates payments directly into everyday interactions. Since bank accounts and payments are already linked within the app for handling reimbursements, the infrastructure already exists to support seamless peer-to-peer transactions. Instead of just sending money, Buy4Me makes financial exchanges more purposeful—tying them to real-world actions like running errands for friends.
An additional feature we are seeking to incorporate is live location sharing (currently only shared when a user manually presses a button in the app). To complement this we want to implement smart notifications so users can favorite frequent stores or places they need items from. Then, when a friend is near one of those stores, they’ll automatically get notified—making coordination effortless and eliminating unnecessary trips.
We also plan to introduce a "gift" feature, where users can say "Pick up my coffee, and I’ll cover yours too”. This simple yet thoughtful addition reinforces Buy4Me’s core idea: that friends are doing each other favors, not just exchanging money. By making transactions more interactive and rewarding, Buy4Me creates a seamless blend of convenience, social connection, and financial integration.
