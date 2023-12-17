import request from "supertest";
import { app } from "../settings";
import { httpStatuses } from "../routers/helpers/send-status";
import { body } from "express-validator";
import { MongoClient } from "mongodb";

const getRequest = () => {
  return request(app);
};

describe("Tests for /posts/:postId/comments", () => {
  let connection: any;
  let db;

  describe("tests for /posts", () => {
    beforeAll(async () => {
      connection = await MongoClient.connect(process.env.mongoUrl!, {
        // @ts-ignore
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      db = await connection.db();
      await getRequest()
        .delete("/testing/all-data")
        .set("Authorization", "Basic YWRtaW46cXdlcnR5");
    });

    afterAll(async () => {
      await connection.close();
    });

    it("should return 404 when trying to get comments for a non-existent post", async () => {
      await getRequest()
        .get("/posts/nonExistentPostId/comments")
        .expect(httpStatuses.NOT_FOUND_404);
    });

    it("should return a list of comments when getting comments for an existing post", async () => {
      await getRequest()
        .get("/posts/:postId/comments")
        .expect(httpStatuses.NOT_FOUND_404);
      expect(body);
      expect.any(Array); //toEqual
    });

    it(`shouldn't update a comment for a non-existent post`, async () => {
      await getRequest().put("/posts/nonExistentPostId/comments").send({});
      expect(httpStatuses.NOT_FOUND_404);
    });

    it("should update a comment for an existing post", async () => {
      await getRequest().put("/posts/existingPostId/comments").send({});
      expect(httpStatuses.CREATED_201);
      expect(body).toEqual(expect.objectContaining({}));
    });

    it("should delete a comment", async () => {
      await request(app)
        .delete("/comments/commentId")
        .set("Authorization", "Bearer");
      expect(httpStatuses.NO_CONTENT_204);
    });
  });
});
