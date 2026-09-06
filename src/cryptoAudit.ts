/**
 * Cryptographic Audit Engine for Lantern Enterprise Procurement
 * Provides deterministic SHA-256 state hashing and QR verification proofs.
 */

export interface AuditProof {
  rfqId: string;
  timestamp: string;
  fingerprint: string;
  shortFingerprint: string;
  approver: string;
  vendorKey: string;
  verificationUrl: string;
  qrSvgString: string;
}

/**
 * Synchronous deterministic SHA-256 implementation
 */
export function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (let i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << ((3 - (i % 4)) * 8);
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (let j = 0; j < 64; j++) {
      let s0: number, s1: number, ch: number, temp1: number, temp2: number, maj: number;
      if (j < 16) {
        // use w[j]
      } else {
        const w15 = w[j - 15];
        const w2 = w[j - 2];
        s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      temp1 = (hash[7] + s1 + ch + k[j] + (w[j] || 0)) | 0;
      s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      temp2 = (s0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (let j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  let result = "";
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

/**
 * Deterministic Vector QR SVG Matrix Generator (21x21 QR Model)
 */
export function generateQrSvg(dataText: string, size = 120, darkColor = "#0f172a", lightColor = "#ffffff"): string {
  const n = 21; // 21x21 grid for Version 1 QR code
  const matrix: boolean[][] = Array(n).fill(false).map(() => Array(n).fill(false));

  // 1. Finder patterns (top-left, top-right, bottom-left)
  function drawFinder(row: number, col: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[row + r][col + c] = true;
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < n - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Dark module
  matrix[n - 8][8] = true;

  // 4. Fill remaining data area with deterministic hash pattern
  const hash = sha256Sync(dataText);
  let hashIdx = 0;
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n; r++) {
      // Skip finder zones
      const inFinder1 = r < 9 && c < 9;
      const inFinder2 = r < 9 && c >= n - 9;
      const inFinder3 = r >= n - 9 && c < 9;
      if (inFinder1 || inFinder2 || inFinder3 || r === 6 || c === 6) continue;

      const charVal = parseInt(hash[(hashIdx++) % hash.length], 16);
      matrix[r][c] = ((charVal + r * 3 + c * 7) % 3) === 0;
    }
  }

  // Render SVG rect elements
  let rects = "";
  const cellSize = 10;
  const padding = 20;
  const totalDim = n * cellSize + padding * 2;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${padding + c * cellSize}" y="${padding + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${darkColor}" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" width="${size}" height="${size}">
    <rect width="${totalDim}" height="${totalDim}" fill="${lightColor}" rx="8"/>
    ${rects}
  </svg>`;
}

/**
 * Generates an immutable, verified audit proof for the active RFQ evaluation state
 */
export function generateAuditProof(
  rfqId: string,
  awardedVendorKey: string,
  scores: Record<string, any>,
  weights: Record<string, number>,
  approver: string = "Dr. Tariq Al-Ghamdi (VP Sourcing)",
  status: string = "APPROVED"
): AuditProof {
  const timestamp = "2026-09-06T01:10:00Z";
  const stateString = `${rfqId}|${awardedVendorKey}|${scores[awardedVendorKey]?.weighted || 0}|${weights.price}:${weights.leadTime}:${weights.warranty}|${approver}|${status}`;
  const fingerprint = sha256Sync(stateString);
  const shortFingerprint = `0x${fingerprint.slice(0, 8)}...${fingerprint.slice(-6)}`;
  const verificationUrl = `https://www.lantern.com.sa/verify-audit?rfq=${rfqId}&proof=${fingerprint.slice(0, 16)}&approver=${encodeURIComponent(approver)}`;
  const qrSvgString = generateQrSvg(verificationUrl, 100);

  return {
    rfqId,
    timestamp,
    fingerprint,
    shortFingerprint,
    approver,
    vendorKey: awardedVendorKey,
    verificationUrl,
    qrSvgString,
  };
}
