import request from "supertest";
import { app }  from "../../src/server";
import { connectionStore } from "../../src/services/scheduler.service";
import { v4 as uuidv4 }   from "uuid";

// Pre-seed a connection
beforeAll(() => {
  connectionStore.push({
    id:        "test-conn-1",
    name:      "Test SQLite",
    type:      "sqlite",
    host:      "localhost",
    port:      0,
    username:  "admin",
    password:  "pass",
    database:  ":memory:",
    createdAt: new Date().toISOString(),
  });
});

describe("Backups API", () => {
  it("GET /api/backups — returns array", async () => {
    const res = await request(app).get("/api/backups");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/backups — 404 for invalid connection", async () => {
    const res = await request(app)
      .post("/api/backups")
      .send({
        connectionId: "invalid-id",
        backupType:   "full",
        storageType:  "local",
      });
    expect(res.status).toBe(404);
  });

  it("GET /api/backups/invalid — 404", async () => {
    const res = await request(app).get("/api/backups/invalid-id");
    expect(res.status).toBe(404);
  });
});