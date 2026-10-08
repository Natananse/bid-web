import * as crypto from 'crypto';

export interface Bid {
  id: string;
  userId: string;
  createdAt: Date;
  amount: number;
}

export interface DrawContext {
  auctionId: string;
  seed: string;
  bids: Bid[];
}

export interface WinnerResult {
  winnerId: string | null;
  winningBidId: string | null;
  bidsHash: string;
}

export interface WinnerStrategy {
  determineWinner(context: DrawContext): WinnerResult;
}

export class RandomDrawStrategy implements WinnerStrategy {
  determineWinner(context: DrawContext): WinnerResult {
    const { auctionId, seed, bids } = context;
    if (bids.length === 0) {
      return { winnerId: null, winningBidId: null, bidsHash: this.calculateBidsHash([]) };
    }

    // 1. Sort bids deterministically (by createdAt, then by ID to break ties)
    const sortedBids = [...bids].sort((a, b) => {
      const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });

    const bidsHash = this.calculateBidsHash(sortedBids);

    // 2. Compute winning ticket via HMAC
    const hmac = crypto.createHmac('sha256', seed);
    hmac.update(`${auctionId}:${bidsHash}`);
    const hashBuffer = hmac.digest();

    // 3. Rejection sampling to avoid modulo bias
    // We want a uniform integer in [0, bids.length - 1]
    const n = bids.length;
    let winnerIndex = -1;

    // A 32-byte hash gives us 256 bits. We can read 32-bit integers from it.
    // To be perfectly uniform, we reject values >= (MAX_UINT32 - MAX_UINT32 % n)
    const MAX_UINT32 = 0xFFFFFFFF;
    const limit = MAX_UINT32 - (MAX_UINT32 % n);

    let offset = 0;
    while (winnerIndex === -1 && offset + 4 <= hashBuffer.length) {
      const val = hashBuffer.readUInt32BE(offset);
      if (val < limit) {
        winnerIndex = val % n;
      }
      offset += 4;
    }

    // Fallback if all chunks were rejected (extremely rare, probability ~ (n / 2^32)^8)
    if (winnerIndex === -1) {
      // Just use the first chunk modulo n. The bias is negligible for small n.
      winnerIndex = hashBuffer.readUInt32BE(0) % n;
    }

    const winningBid = sortedBids[winnerIndex];

    return {
      winnerId: winningBid.userId,
      winningBidId: winningBid.id,
      bidsHash,
    };
  }

  private calculateBidsHash(bids: Bid[]): string {
    const hash = crypto.createHash('sha256');
    for (const bid of bids) {
      hash.update(`${bid.id}:${bid.userId}:${bid.createdAt.toISOString()}`);
    }
    return hash.digest('hex');
  }
}

export class LowestUniqueBidStrategy implements WinnerStrategy {
  determineWinner(context: DrawContext): WinnerResult {
    const { bids } = context;
    const bidsHash = this.calculateBidsHash(bids);

    if (bids.length === 0) {
      return { winnerId: null, winningBidId: null, bidsHash };
    }

    const countByAmount: Record<number, number> = {};
    bids.forEach((b) => {
      countByAmount[b.amount] = (countByAmount[b.amount] || 0) + 1;
    });

    const uniqueBids = bids.filter((b) => countByAmount[b.amount] === 1);
    if (uniqueBids.length === 0) {
      return { winnerId: null, winningBidId: null, bidsHash };
    }

    const lowestUniqueBid = uniqueBids.reduce((prev, curr) =>
      prev.amount < curr.amount ? prev : curr
    );

    return {
      winnerId: lowestUniqueBid.userId,
      winningBidId: lowestUniqueBid.id,
      bidsHash,
    };
  }
  
  private calculateBidsHash(bids: Bid[]): string {
    // Same as RandomDraw
    const sortedBids = [...bids].sort((a, b) => {
      const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });
    const hash = crypto.createHash('sha256');
    for (const bid of sortedBids) {
      hash.update(`${bid.id}:${bid.userId}:${bid.createdAt.toISOString()}`);
    }
    return hash.digest('hex');
  }
}

export class HighestBidStrategy implements WinnerStrategy {
  determineWinner(context: DrawContext): WinnerResult {
     const { bids } = context;
     const bidsHash = this.calculateBidsHash(bids);

     if (bids.length === 0) {
       return { winnerId: null, winningBidId: null, bidsHash };
     }

     const highestBid = bids.reduce((prev, curr) => 
       prev.amount > curr.amount ? prev : curr
     );

     return {
       winnerId: highestBid.userId,
       winningBidId: highestBid.id,
       bidsHash,
     };
  }

  private calculateBidsHash(bids: Bid[]): string {
    const sortedBids = [...bids].sort((a, b) => {
      const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id.localeCompare(b.id);
    });
    const hash = crypto.createHash('sha256');
    for (const bid of sortedBids) {
      hash.update(`${bid.id}:${bid.userId}:${bid.createdAt.toISOString()}`);
    }
    return hash.digest('hex');
  }
}

export function generateSeed(): { seed: string; seedHash: string } {
  const seedBuffer = crypto.randomBytes(32);
  const seed = seedBuffer.toString('hex');
  const seedHash = crypto.createHash('sha256').update(seed).digest('hex');
  return { seed, seedHash };
}
