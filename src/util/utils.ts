import crypto from 'crypto';

export const getRandomVerificationCode = (length: number) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let code = [];
  for (let i = 0; i < length; ++i) {
    const index = crypto.randomBytes(1)[0] % alphabet.length;
    code.push(alphabet[index]);
  }

  return code.join('');
};
