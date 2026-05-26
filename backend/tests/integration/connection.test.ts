import request from "supertest";
import { app }  from "../../src/server";

describe("Connections API", () => {
  let connectionId: string;

  it("GET /api/connections — returns empty array", async () => {
    const res = await request(app).get("/api/connections");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/connections — creates connection", async () => {
    const res = await request(app)
      .post("/api/connections")
      .send({
        name:     "Test DB",
        type:     "sqlite",
        host:     "localhost",
        port:     0,
        username: "admin",
        password: "pass",
        database: ":memory:",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test DB");
    connectionId = res.body.data.id;
  });

  it("DELETE /api/connections/:id — deletes connection", async () => {
    const res = await request(app).delete(`/api/connections/${connectionId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("DELETE /api/connections/invalid — returns 404", async () => {
    const res = await request(app).delete("/api/connections/invalid_id");
    expect(res.status).toBe(404);
  });
});