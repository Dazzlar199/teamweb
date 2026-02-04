"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEAM_MEMBER_NAMES } from "@/lib/constants/team";

const REQUIRED_PASSWORD = "nca1234";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // 환경 변수 로드 체크
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log("Supabase Config Check:", {
      hasUrl: !!url,
      hasKey: !!key,
      urlPrefix: url?.substring(0, 10)
    });
    if (!url || !key) {
      console.warn("⚠️ Supabase 미설정 - 로컬 모드로 전환");
      setIsLocalMode(true);
    }
  }, []);

  const getEmailId = (koreanName: string): string | null => {
    // 안전한 매핑을 위해 switch문 사용
    switch (koreanName) {
      case "김찬주": return "chanju";
      case "박건희": return "geonhee";
      case "이나영": return "nayoung";
      case "김예린": return "yerin";
      default: return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    try {
      // 1. 기초 유효성 검사
      if (!(TEAM_MEMBER_NAMES as readonly string[]).includes(trimmedName)) {
        throw new Error(`"${trimmedName}"은(는) 등록된 팀원이 아닙니다.`);
      }

      if (trimmedPassword !== REQUIRED_PASSWORD) {
        throw new Error("비밀번호가 올바르지 않습니다.");
      }

      // 🔄 로컬 모드: Supabase 없이 localStorage만 사용
      if (isLocalMode) {
        console.log("🏠 로컬 모드 로그인:", trimmedName);
        localStorage.setItem("local-user", JSON.stringify({ name: trimmedName }));

        const searchParams = new URLSearchParams(window.location.search);
        const next = searchParams.get("next") || "/";
        router.push(next);
        router.refresh();
        return;
      }

      // 2. Supabase용 이메일 생성
      const emailId = getEmailId(trimmedName);
      if (!emailId) throw new Error("계정 매핑 오류가 발생했습니다.");
      
      // 도메인 유효성 문제를 피하기 위해 standard한 example.com 사용
      const email = `${emailId}@example.com`.trim();
      
      console.log("Login Attempt:", { email }); 

      // 3. 로그인 시도
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: trimmedPassword,
      });

      // 4. 로그인 실패 시 (계정 없음), 자동 회원가입 시도
      if (signInError && signInError.message.includes("Invalid login credentials")) {
        console.log("계정이 없어 자동 생성을 시도합니다...", email);
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: trimmedPassword,
          options: {
            data: { name: trimmedName }
          }
        });
        
        if (signUpError) {
            console.error("Signup Error Full:", JSON.stringify(signUpError, null, 2));
            throw new Error(`회원가입 실패: ${signUpError.message} (${signUpError.status || 'No Status'})`);
        }
        
        // 회원가입 후 재로그인
        const { error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password: trimmedPassword,
        });
        if (retryError) throw retryError;
      } else if (signInError) {
        console.error("Signin Error:", signInError);
        throw signInError;
      }

      // 성공 - 세션 확인 후 리다이렉트
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // 약간의 대기 후 리다이렉트 (쿠키 완전히 설정되도록)
        await new Promise(resolve => setTimeout(resolve, 100));

        const searchParams = new URLSearchParams(window.location.search);
        const next = searchParams.get("next") || "/";
        router.push(next);
        router.refresh();
      } else {
        throw new Error("세션 생성에 실패했습니다. 다시 시도해주세요.");
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            팀 대시보드
          </h1>
          <p className="text-gray-600">이름과 팀 공용 비밀번호를 입력하세요</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 입력 (예: 김찬주)"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">
            등록된 팀원
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {TEAM_MEMBER_NAMES.map((name) => (
              <span
                key={name}
                onClick={() => setName(name)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium cursor-pointer hover:bg-gray-200 transition"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}