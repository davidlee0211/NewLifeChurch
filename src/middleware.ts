import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지, 홈, API, 정적 파일은 통과
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 쿠키에서 인증 정보 확인 (localStorage는 서버에서 접근 불가)
  // 클라이언트에서 localStorage로 관리하므로 여기서는 기본 통과
  // 실제 보호는 클라이언트 컴포넌트에서 처리

  // 학생 경로 체크
  if (pathname.startsWith("/student")) {
    // 클라이언트에서 추가 검증 필요
    return NextResponse.next();
  }

  // 관리자 경로 체크
  if (pathname.startsWith("/admin")) {
    // 클라이언트에서 추가 검증 필요
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
