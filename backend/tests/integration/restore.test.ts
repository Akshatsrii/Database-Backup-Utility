import request from "supertest";
import { app }  from "../../src/server";

describe("Restore API", () => {
  it("GET /api/restore/jobs — returns array", async () => {
    const res = await request(app).get("/api/restore/jobs");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/restore — 404 for invalid backup", async () => {
    const res = await request(app)
      .post("/api/restore")
      .send({
        backupId:     "invalid-backup",
        connectionId: "invalid-conn",
      });
    expect(res.status).toBe(404);
  });
});