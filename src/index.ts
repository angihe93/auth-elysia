import { Elysia, t, status } from "elysia";
import swagger from "@elysiajs/swagger"

const PORT = 3000

// test users
const users = [
  { id: 1, username: "admin", password: "admin123", role: "admin", secret: "admin-secret-123" },
  { id: 2, username: "user", password: "user123", role: "basic", secret: "user-secret-456" }
];

const app = new Elysia()
  .use(swagger({
    path: '/api-docs'
  }))
  .get("/", () => "Hello Elysia")

  .get("/api/public", () => { return { message: "This is public information" } })

  .derive(({ headers }) => {
    const auth = headers['authorization']
    return { // add bearer to the context for all subsequent handlers
      bearer: auth?.startsWith('Bearer ') ? auth.slice(7) : null
    }
  })
  .get("/api/protected", (bearer) => {
    console.log(bearer)
    return { message: "Only admin should be able to see this" }
  },
    {
      beforeHandle({ bearer }) {
        if (!bearer) return status(401)
        const res = users.filter((u) => u.secret === bearer)
        if (!res.length || res[0].secret !== bearer) return status(401)
      }
    }
  )
  .listen(PORT);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
