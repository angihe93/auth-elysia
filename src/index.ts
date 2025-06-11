import { Elysia, t, status } from "elysia";
import swagger from "@elysiajs/swagger"
import { jwt } from '@elysiajs/jwt'

const PORT = 3000
const JWT_SECRET = process.env.JWT_SECRET as string // generated with https://dev.to/tkirwa/generate-a-random-jwt-secret-key-39j4
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}
const COOKIE_SECRET = process.env.COOKIE_SECRET
if (!COOKIE_SECRET) {
  throw new Error("COOKIE_SECRET is not set");
}

// test users
const users = [
  { id: 1, username: "admin", password: "admin123", role: "admin", secret: "admin-secret-123" },
  { id: 2, username: "user", password: "user123", role: "basic", secret: "user-secret-456" }
];

const app = new Elysia({
  cookie: { // https://elysiajs.com/patterns/cookie.html#constructor
    secrets: COOKIE_SECRET,
    sign: ['auth']
  }
})
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
        const res = users.filter((u) => u.secret === bearer && u.role === "admin")
        // this only works if secrets are unique
        if (!res.length || res[0].secret !== bearer) return status(401)
      }
    }
  )

  .use(
    jwt({
      name: 'jwt',
      secret: JWT_SECRET,
      exp: '1h'
    })
  )
  .post('/api/login',
    async ({ jwt, body, cookie: { auth } }) => {
      const username = body.username
      const password = body.password
      const result = users.filter((u) => u.username === username && u.password === password)
      if (!result.length)
        return status(401)
      const role = result[0].role
      const id = result[0].id
      console.log(username, password, id, role)
      // sign jwt
      const signedJwt = await jwt.sign({ id, role, exp: '1h' })
      console.log(signedJwt)
      // set auth cookie:
      auth.set({ value: signedJwt, expires: new Date(Date.now() + (3600 * 1000 * 24)) })
      console.log(auth)
    },
    { // validate types
      body: t.Object({
        username: t.String(),
        password: t.String()
      }),
      response: t.Object({
      }, { description: 'a JWT will be set in cookies after successful login' })
    }
  )

  .listen(PORT);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
