const { generateSecret, verifySync } = require('otplib');

const secret = generateSecret();
console.log('Secret:', secret);

// Try verifySync with object
try {
  const result = verifySync({ token: '123456', secret });
  console.log('verifySync({token, secret}) works');
} catch (e) {
  console.log('verifySync({token, secret}) failed:', e.message);
}

// Try verifySync with arguments
try {
  const result = verifySync('123456', secret);
  console.log('verifySync(token, secret) works');
} catch (e) {
  console.log('verifySync(token, secret) failed:', e.message);
}
