"use client";

import { useState } from "react";
import { useUser } from "@/lib/context/UserContext";
import { TEAM_MEMBERS, TEAM_MEMBER_NAMES } from "@/lib/constants/team";
import { getUserInfo } from "@/lib/types/user";

const REQUIRED_PASSWORD = "nca1234";

export default function LoginForm() {
  const [inputName, setInputName] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useUser();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = inputName.trim();
    const trimmedPassword = inputPassword.trim();

    if (!trimmedName) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (!trimmedPassword) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    // 비밀번호 확인
    if (trimmedPassword !== REQUIRED_PASSWORD) {
      setError("비밀번호가 올바르지 않습니다.");
      return;
    }

    // 팀원 목록에 있는 이름인지 확인
    if (!TEAM_MEMBER_NAMES.includes(trimmedName as any)) {
      setError(
        `"${trimmedName}"은(는) 등록된 팀원이 아닙니다.\n팀원 목록: ${TEAM_MEMBER_NAMES.join(", ")}`
      );
      return;
    }

    // 로그인 성공 (비밀번호와 이름 모두 확인 완료)
    const user = getUserInfo(trimmedName as any);
    setUser(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            팀 대시보드
          </h1>
          <p className="text-gray-600">이름과 비밀번호를 입력하여 로그인하세요</p>
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
              value={inputName}
              onChange={(e) => {
                setInputName(e.target.value);
                setError("");
              }}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              autoFocus
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
              value={inputPassword}
              onChange={(e) => {
                setInputPassword(e.target.value);
                setError("");
              }}
              placeholder="비밀번호를 입력하세요"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            로그인
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
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
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

