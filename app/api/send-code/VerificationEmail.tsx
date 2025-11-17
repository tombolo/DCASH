import React from 'react';

interface VerificationEmailProps {
  code: string;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({ code }) => (
  <div>
    <h1>Your Verification Code</h1>
    <p>Your verification code is: <strong>{code}</strong></p>
    <p>This code will expire in 10 minutes.</p>
  </div>
);
