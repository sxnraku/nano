/**
 * Standard Elo Rating System implementation
 * @param playerElo Current Elo of the player
 * @param opponentElo Current Elo of the opponent
 * @param win 1 for win, 0 for loss, 0.5 for draw
 * @param kFactor Sensitivity factor (default 32)
 * @returns The amount of Elo to add/subtract
 */
export const calculateEloChange = (
  playerElo: number,
  opponentElo: number,
  score: 1 | 0 | 0.5,
  kFactor: number = 32
): number => {
  // Expected score calculation
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  
  // Elo change calculation
  const change = Math.round(kFactor * (score - expectedScore));
  
  return change;
};

/**
 * Calculates win/loss delta for both players
 */
export const getPvPEloExchange = (playerElo: number, opponentElo: number, isWinner: boolean) => {
  const score = isWinner ? 1 : 0;
  const playerDelta = calculateEloChange(playerElo, opponentElo, score);
  
  // For zero-sum (ish) exchange
  const opponentDelta = calculateEloChange(opponentElo, playerElo, isWinner ? 0 : 1);
  
  return {
    playerDelta,
    opponentDelta
  };
};
