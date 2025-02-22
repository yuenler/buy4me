// src/components/PlaidLinkComponent.tsx
import React from 'react';
import { usePlaidLink } from 'react-plaid-link';

const PlaidLinkComponent: React.FC = () => {
  const config = {
    token: 'GENERATED_LINK_TOKEN', // Securely generate and fetch this from your backend
    onSuccess: (public_token: string, metadata: any) => {
      // Exchange the public token on your backend
      console.log('Public token:', public_token);
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <button onClick={() => open()} disabled={!ready} className="bg-blue-500 text-white px-4 py-2 rounded">
      Link Bank Account
    </button>
  );
};

export default PlaidLinkComponent;
