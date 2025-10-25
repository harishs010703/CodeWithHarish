// utils/generateSessionId.ts
export const generateSessionId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const blocks = Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return blocks.join('-'); // e.g., "a3d4-fg5k-9pl1"
};
