import fs   from "fs";
import path from "path";
import { CompressionService } from "../../src/services/compression.service";

const svc     = new CompressionService();
const testDir = path.join(__dirname, "tmp");
const testFile = path.join(testDir, "test.sql");

beforeAll(() => {
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(testFile, "SELECT * FROM users;\n".repeat(1000));
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

describe("CompressionService", () => {
  it("should compress a file and return .gz path", async () => {
    const compressed = await svc.compress(testFile);
    expect(compressed).toMatch(/\.gz$/);
    expect(fs.existsSync(compressed)).toBe(true);
  });

  it("compressed file should be smaller", async () => {
    const gzFile  = `${testFile}.gz`;
    const before  = 1000 * "SELECT * FROM users;\n".length;
    const after   = fs.statSync(gzFile).size;
    expect(after).toBeLessThan(before);
  });

  it("should decompress back", async () => {
    const gzFile     = `${testFile}.gz`;
    const decompressed = await svc.decompress(gzFile);
    expect(fs.existsSync(decompressed)).toBe(true);
  });

  it("getCompressionRatio should return correct %", () => {
    const ratio = svc.getCompressionRatio(1000, 400);
    expect(ratio).toBe(60);
  });
});