import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  //Token will exists if user is logged in
  const token = await getToken({ req, secret: process.env.JWT_SECRET });
  

  const { pathname } = req.nextUrl;
  //Allow the request if the following conditions are met
  // 1. Its a request for next-auth session & provider fetching
  // the token exists

  if (pathname.includes("/api/auth") || token) {
    return NextResponse.next();
  }

  //Redirect lo login if they don't have a token AND a requesting page is not the login page
  if (!token && pathname !== "/login") {
    return NextResponse.redirect("/login");
  }
}
