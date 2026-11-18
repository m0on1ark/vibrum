// Minimal ISO/IEC 18004 QR Code encoder (Byte mode, EC Level L, Versions 1-8).

type VersionSpec = {
  version: number;
  dataCodewords: number;
  ecPerBlock: number;
  blocks: number;
  alignments: readonly number[];
};

const VERSIONS_L: readonly VersionSpec[] = [
  { version: 1, dataCodewords: 19, ecPerBlock: 7, blocks: 1, alignments: [] },
  { version: 2, dataCodewords: 34, ecPerBlock: 10, blocks: 1, alignments: [6, 18] },
  { version: 3, dataCodewords: 55, ecPerBlock: 15, blocks: 1, alignments: [6, 22] },
  { version: 4, dataCodewords: 80, ecPerBlock: 20, blocks: 1, alignments: [6, 26] },
  { version: 5, dataCodewords: 108, ecPerBlock: 26, blocks: 1, alignments: [6, 30] },
  { version: 6, dataCodewords: 136, ecPerBlock: 18, blocks: 2, alignments: [6, 34] },
  { version: 7, dataCodewords: 156, ecPerBlock: 20, blocks: 2, alignments: [6, 22, 38] },
  { version: 8, dataCodewords: 194, ecPerBlock: 24, blocks: 2, alignments: [6, 24, 42] },
];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
}

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsComputeEc(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const rem = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      rem[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return rem;
}

function bchRemainder(value: number, poly: number, polyDegree: number): number {
  let rem = value << polyDegree;
  const topBit = 1 << polyDegree;
  for (let shift = 14; shift >= 0; shift--) {
    if (rem & (topBit << shift)) {
      rem ^= poly << shift;
    }
  }
  return rem;
}

function computeFormatBits(mask: number): number {
  // EC Level L = 0b01; generator = 0x537 (degree 10); XOR mask = 0x5412.
  const data = (0b01 << 3) | mask;
  const rem = bchRemainder(data, 0x537, 10);
  return ((data << 10) | rem) ^ 0x5412;
}

function computeVersionBits(version: number): number {
  // Generator = 0x1f25 (degree 12).
  const rem = bchRemainder(version, 0x1f25, 12);
  return (version << 12) | rem;
}

function encodeCodewords(bytes: Uint8Array, spec: VersionSpec): Uint8Array {
  const totalBits = spec.dataCodewords * 8;
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8); // Character count for Versions 1-8
  for (const byte of bytes) pushBits(byte, 8);

  const terminatorLen = Math.min(4, totalBits - bits.length);
  pushBits(0, terminatorLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const data = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < bits.length / 8; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    data[i] = b;
  }

  let padToggle = 0;
  for (let i = bits.length / 8; i < spec.dataCodewords; i++) {
    data[i] = padToggle === 0 ? 0xec : 0x11;
    padToggle ^= 1;
  }

  const blockSize = spec.dataCodewords / spec.blocks;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  for (let b = 0; b < spec.blocks; b++) {
    const slice = data.subarray(b * blockSize, (b + 1) * blockSize);
    dataBlocks.push(slice);
    ecBlocks.push(rsComputeEc(slice, spec.ecPerBlock));
  }

  const result = new Uint8Array(spec.dataCodewords + spec.blocks * spec.ecPerBlock);
  let out = 0;
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < spec.blocks; b++) result[out++] = dataBlocks[b][i];
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) result[out++] = ecBlocks[b][i];
  }
  return result;
}

function createMatrix(size: number): boolean[][] {
  return Array.from({ length: size }, () => Array<boolean>(size).fill(false));
}

function placeFinder(
  modules: boolean[][],
  isFunction: boolean[][],
  top: number,
  left: number,
) {
  const size = modules.length;
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const r = top + dr;
      const c = left + dc;
      if (r < 0 || r >= size || c < 0 || c >= size) continue;
      const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
      const onEdge = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      const inCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      modules[r][c] = inOuter && (onEdge || inCenter);
      isFunction[r][c] = true;
    }
  }
}

function placeAlignment(
  modules: boolean[][],
  isFunction: boolean[][],
  centerR: number,
  centerC: number,
) {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const r = centerR + dr;
      const c = centerC + dc;
      modules[r][c] =
        Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
      isFunction[r][c] = true;
    }
  }
}

function placeFunctionPatterns(
  modules: boolean[][],
  isFunction: boolean[][],
  spec: VersionSpec,
) {
  const size = modules.length;
  placeFinder(modules, isFunction, 0, 0);
  placeFinder(modules, isFunction, 0, size - 7);
  placeFinder(modules, isFunction, size - 7, 0);

  for (const r of spec.alignments) {
    for (const c of spec.alignments) {
      const overlapsFinder =
        (r <= 7 && c <= 7) ||
        (r <= 7 && c >= size - 8) ||
        (r >= size - 8 && c <= 7);
      if (!overlapsFinder) placeAlignment(modules, isFunction, r, c);
    }
  }

  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    isFunction[6][i] = true;
    modules[i][6] = i % 2 === 0;
    isFunction[i][6] = true;
  }

  // Dark module
  modules[size - 8][8] = true;
  isFunction[size - 8][8] = true;

  // Reserve format info modules (values written per mask later)
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    if (i < 7) isFunction[size - 1 - i][8] = true;
  }

  if (spec.version >= 7) {
    const versionBits = computeVersionBits(spec.version);
    for (let i = 0; i < 18; i++) {
      const bit = ((versionBits >> i) & 1) === 1;
      const row = Math.floor(i / 3);
      const col = size - 11 + (i % 3);
      modules[row][col] = bit;
      isFunction[row][col] = true;
      modules[col][row] = bit;
      isFunction[col][row] = true;
    }
  }
}

function placeDataBits(
  modules: boolean[][],
  isFunction: boolean[][],
  codewords: Uint8Array,
) {
  const size = modules.length;
  const totalDataBits = codewords.length * 8;
  let bitIdx = 0;
  let upward = true;

  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5;
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (let dx = 0; dx < 2; dx++) {
        const col = rightCol - dx;
        if (isFunction[row][col]) continue;
        if (bitIdx < totalDataBits) {
          const byte = codewords[bitIdx >> 3];
          modules[row][col] = ((byte >> (7 - (bitIdx & 7))) & 1) === 1;
        }
        bitIdx++;
      }
    }
    upward = !upward;
  }
}

function maskCondition(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    default:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }
}

function writeFormatInfo(modules: boolean[][], mask: number) {
  const size = modules.length;
  const bits = computeFormatBits(mask);
  const bitAt = (i: number) => ((bits >> i) & 1) === 1;

  for (let i = 0; i <= 5; i++) modules[8][i] = bitAt(14 - i);
  modules[8][7] = bitAt(8);
  modules[8][8] = bitAt(7);
  modules[7][8] = bitAt(6);
  for (let i = 0; i <= 5; i++) modules[5 - i][8] = bitAt(5 - i);

  for (let i = 0; i <= 6; i++) modules[size - 1 - i][8] = bitAt(14 - i);
  for (let i = 0; i <= 7; i++) modules[8][size - 8 + i] = bitAt(7 - i);
}

function countLinePenalty(line: boolean[]): number {
  let penalty = 0;
  let runColor = line[0];
  let runLen = 1;
  for (let i = 1; i < line.length; i++) {
    if (line[i] === runColor) {
      runLen++;
    } else {
      if (runLen >= 5) penalty += 3 + (runLen - 5);
      runColor = line[i];
      runLen = 1;
    }
  }
  if (runLen >= 5) penalty += 3 + (runLen - 5);

  for (let i = 0; i <= line.length - 11; i++) {
    const a =
      line[i] &&
      !line[i + 1] &&
      line[i + 2] &&
      line[i + 3] &&
      line[i + 4] &&
      !line[i + 5] &&
      line[i + 6] &&
      !line[i + 7] &&
      !line[i + 8] &&
      !line[i + 9] &&
      !line[i + 10];
    const b =
      !line[i] &&
      !line[i + 1] &&
      !line[i + 2] &&
      !line[i + 3] &&
      line[i + 4] &&
      !line[i + 5] &&
      line[i + 6] &&
      line[i + 7] &&
      line[i + 8] &&
      !line[i + 9] &&
      line[i + 10];
    if (a || b) penalty += 40;
  }

  return penalty;
}

function evaluatePenalty(modules: boolean[][]): number {
  const size = modules.length;
  let penalty = 0;
  const col = new Array<boolean>(size);

  for (let r = 0; r < size; r++) {
    penalty += countLinePenalty(modules[r]);
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size; r++) col[r] = modules[r][c];
    penalty += countLinePenalty(col);
  }

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c];
      if (
        modules[r][c + 1] === v &&
        modules[r + 1][c] === v &&
        modules[r + 1][c + 1] === v
      ) {
        penalty += 3;
      }
    }
  }

  let darkCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) darkCount++;
    }
  }
  const percent = (darkCount * 100) / (size * size);
  const prev5 = Math.floor(percent / 5) * 5;
  const next5 = prev5 + 5;
  penalty +=
    (Math.min(Math.abs(prev5 - 50), Math.abs(next5 - 50)) / 5) * 10;

  return penalty;
}

export function encodeQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const spec = VERSIONS_L.find((v) => bytes.length <= v.dataCodewords - 2);
  if (!spec) {
    throw new Error("Payload exceeds QR code capacity (max 192 bytes)");
  }

  const size = 17 + 4 * spec.version;
  const base = createMatrix(size);
  const isFunction = createMatrix(size);

  placeFunctionPatterns(base, isFunction, spec);
  placeDataBits(base, isFunction, encodeCodewords(bytes, spec));

  let bestMatrix = base;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = base.map((row, r) =>
      row.map((val, c) =>
        isFunction[r][c] ? val : maskCondition(mask, r, c) ? !val : val,
      ),
    );
    writeFormatInfo(candidate, mask);
    const penalty = evaluatePenalty(candidate);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMatrix = candidate;
    }
  }

  return bestMatrix;
}
