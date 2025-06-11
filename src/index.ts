import { Elysia } from "elysia";
import swagger from "@elysiajs/swagger"

const PORT = 3000

const app = new Elysia()
  .use(swagger({
    path: '/api-docs'
  }))
  .get("/", () => "Hello Elysia")
  .get("/api/public", () => { return { message: "This is public information" } })
  .get("/api/protected", () => { return { message: "Only admin should be able to see this" } })
  .listen(PORT);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
